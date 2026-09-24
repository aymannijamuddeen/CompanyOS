import { Router } from 'express'
import { prisma } from '../services/prisma.js'
import { authenticate, AuthRequest } from '../middleware/auth.js'

const router = Router()

export function splitIntoChunks(text: string, chunkSize = 500): string[] {
  const cleaned = text.trim()
  if (!cleaned) return []
  if (cleaned.length <= chunkSize) return [cleaned]

  const paragraphs = cleaned.split(/\n\s*\n/)
  const chunks: string[] = []
  let current = ''

  for (const p of paragraphs) {
    const trimmed = p.trim()
    if (!trimmed) continue

    if (current.length + trimmed.length + 2 <= chunkSize) {
      current = current ? `${current}\n\n${trimmed}` : trimmed
    } else {
      if (current) chunks.push(current)
      if (trimmed.length > chunkSize) {
        const sentences = trimmed.split(/(?<=[.?!])\s+/)
        let sCurrent = ''
        for (const s of sentences) {
          if (sCurrent.length + s.length + 1 <= chunkSize) {
            sCurrent = sCurrent ? `${sCurrent} ${s}` : s
          } else {
            if (sCurrent) chunks.push(sCurrent)
            sCurrent = s
          }
        }
        if (sCurrent) current = sCurrent
        else current = ''
      } else {
        current = trimmed
      }
    }
  }
  if (current) chunks.push(current)
  return chunks.length ? chunks : [cleaned]
}

// GET /api/knowledge - List documents with chunk counts and self-healing
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.companyId) return res.status(400).json({ success: false, message: 'No company selected' })

    const page = Math.max(1, parseInt(req.query.page as string || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string || '50', 10)))
    const skip = (page - 1) * limit

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where: { companyId: req.companyId, status: 'active' },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: { _count: { select: { chunks: true } } },
      }),
      prisma.document.count({ where: { companyId: req.companyId, status: 'active' } }),
    ])

    // Self-healing: if any document has 0 chunks, generate them now
    for (const doc of documents) {
      if (doc._count.chunks === 0 && doc.content) {
        const pieces = splitIntoChunks(doc.content)
        if (pieces.length > 0) {
          await prisma.documentChunk.createMany({
            data: pieces.map((content, idx) => ({
              documentId: doc.id,
              chunkIndex: idx,
              content,
            })),
            skipDuplicates: true,
          })
          doc._count.chunks = pieces.length
        }
      }
    }

    res.json({
      success: true,
      data: documents,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/knowledge/:id - Single document with full chunks
router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.companyId) return res.status(400).json({ success: false, message: 'No company context' })

    const document = await prisma.document.findFirst({
      where: { id: req.params.id, companyId: req.companyId },
      include: {
        chunks: { orderBy: { chunkIndex: 'asc' } },
        _count: { select: { chunks: true } },
      },
    })

    if (!document) return res.status(404).json({ success: false, message: 'Document not found' })

    res.json({ success: true, data: document })
  } catch (error) {
    next(error)
  }
})

// POST /api/knowledge - Create document with automatic chunking
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.companyId) return res.status(400).json({ success: false, message: 'No company context' })

    const { title, content, sourceType = 'manual', sourceRef, metadata } = req.body
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, message: 'title is required' })
    }
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ success: false, message: 'content is required' })
    }

    const document = await prisma.document.create({
      data: {
        companyId: req.companyId,
        title: title.trim(),
        content: content.trim(),
        sourceType,
        sourceRef: sourceRef ? String(sourceRef).trim() : null,
        metadata: metadata || null,
        status: 'active',
      },
    })

    // Automatically create chunks for semantic retrieval
    const pieces = splitIntoChunks(content.trim())
    if (pieces.length > 0) {
      await prisma.documentChunk.createMany({
        data: pieces.map((chunkContent, idx) => ({
          documentId: document.id,
          chunkIndex: idx,
          content: chunkContent,
        })),
      })
    }

    if (req.userId) {
      await prisma.activity.create({
        data: {
          companyId: req.companyId,
          actorId: req.userId,
          type: 'document.create',
          message: `Added knowledge document: ${document.title} (${pieces.length} chunks)`,
          metadata: { documentId: document.id, chunksCount: pieces.length },
        },
      })
    }

    const completeDoc = await prisma.document.findUnique({
      where: { id: document.id },
      include: { _count: { select: { chunks: true } } },
    })

    res.status(201).json({ success: true, data: completeDoc })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/knowledge/:id - Delete document
router.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.companyId) return res.status(400).json({ success: false, message: 'No company context' })

    const existing = await prisma.document.findFirst({
      where: { id: req.params.id, companyId: req.companyId },
    })
    if (!existing) return res.status(404).json({ success: false, message: 'Document not found' })

    await prisma.document.delete({ where: { id: existing.id } })

    if (req.userId) {
      await prisma.activity.create({
        data: {
          companyId: req.companyId,
          actorId: req.userId,
          type: 'document.delete',
          message: `Deleted knowledge document: ${existing.title}`,
          metadata: { documentId: existing.id },
        },
      })
    }

    res.json({ success: true, message: 'Document deleted successfully' })
  } catch (error) {
    next(error)
  }
})

export default router
