import { Router } from 'express'
import { prisma } from '../services/prisma.js'
import { authenticate, AuthRequest } from '../middleware/auth.js'

const router = Router()

// GET /api/tasks - List tasks with filtering and pagination
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.companyId) return res.status(400).json({ success: false, message: 'No company selected' })

    const status = req.query.status as string | undefined
    const priority = req.query.priority as string | undefined
    const agentId = req.query.agentId as string | undefined
    const search = req.query.search as string | undefined
    const page = Math.max(1, parseInt(req.query.page as string || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string || '50', 10)))
    const skip = (page - 1) * limit

    const where: any = { companyId: req.companyId }
    if (status && status !== 'all') where.status = status
    if (priority && priority !== 'all') where.priority = priority
    if (agentId && agentId !== 'all') where.agentId = agentId
    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ]
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
        skip,
        take: limit,
        include: {
          agent: { select: { id: true, name: true, slug: true, type: true } },
          assignedTo: { select: { id: true, username: true, email: true } },
          createdBy: { select: { id: true, username: true, email: true } },
        },
      }),
      prisma.task.count({ where }),
    ])

    res.json({
      success: true,
      data: tasks,
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

// GET /api/tasks/:id - Single task
router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.companyId) return res.status(400).json({ success: false, message: 'No company context' })

    const task = await prisma.task.findFirst({
      where: { id: req.params.id, companyId: req.companyId },
      include: {
        agent: { select: { id: true, name: true, slug: true, type: true } },
        assignedTo: { select: { id: true, username: true, email: true } },
        createdBy: { select: { id: true, username: true, email: true } },
      },
    })

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' })

    res.json({ success: true, data: task })
  } catch (error) {
    next(error)
  }
})

// POST /api/tasks - Create task
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.companyId || !req.userId) return res.status(400).json({ success: false, message: 'No company context' })

    const { title, description, priority = 'medium', agentId, dueAt, status = 'todo' } = req.body
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Task title is required' })
    }

    if (agentId) {
      const agent = await prisma.agent.findFirst({
        where: { id: agentId, companyId: req.companyId },
      })
      if (!agent) {
        return res.status(400).json({ success: false, message: 'Selected agent does not belong to your company' })
      }
    }

    const task = await prisma.task.create({
      data: {
        companyId: req.companyId,
        createdById: req.userId,
        title: title.trim(),
        description: description ? String(description).trim() : null,
        priority: ['low', 'medium', 'high', 'urgent'].includes(priority) ? priority : 'medium',
        status: ['todo', 'in_progress', 'done', 'cancelled'].includes(status) ? status : 'todo',
        agentId: agentId || null,
        dueAt: dueAt ? new Date(dueAt) : null,
      },
      include: {
        agent: { select: { id: true, name: true, slug: true, type: true } },
        assignedTo: { select: { id: true, username: true, email: true } },
      },
    })

    await prisma.activity.create({
      data: {
        companyId: req.companyId,
        actorId: req.userId,
        type: 'task.create',
        message: `Created task: ${task.title}`,
        metadata: { taskId: task.id, priority: task.priority },
      },
    })

    res.status(201).json({ success: true, data: task })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/tasks/:id - Update task status, priority, title, description, agent
router.patch('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.companyId) return res.status(400).json({ success: false, message: 'No company context' })

    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, companyId: req.companyId },
    })
    if (!existing) return res.status(404).json({ success: false, message: 'Task not found' })

    const { status, priority, title, description, agentId, dueAt } = req.body

    const updateData: any = {}
    if (status !== undefined) updateData.status = status
    if (priority !== undefined) updateData.priority = priority
    if (title !== undefined && title.trim()) updateData.title = title.trim()
    if (description !== undefined) updateData.description = description
    if (agentId !== undefined) updateData.agentId = agentId || null
    if (dueAt !== undefined) updateData.dueAt = dueAt ? new Date(dueAt) : null

    const task = await prisma.task.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        agent: { select: { id: true, name: true, slug: true, type: true } },
        assignedTo: { select: { id: true, username: true, email: true } },
      },
    })

    if (req.userId) {
      await prisma.activity.create({
        data: {
          companyId: req.companyId,
          actorId: req.userId,
          type: 'task.update',
          message: `Updated task: ${task.title}${status ? ` (${status})` : ''}`,
          metadata: { taskId: task.id, updates: updateData },
        },
      })
    }

    res.json({ success: true, data: task })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.companyId) return res.status(400).json({ success: false, message: 'No company context' })

    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, companyId: req.companyId },
    })
    if (!existing) return res.status(404).json({ success: false, message: 'Task not found' })

    await prisma.task.delete({ where: { id: existing.id } })

    if (req.userId) {
      await prisma.activity.create({
        data: {
          companyId: req.companyId,
          actorId: req.userId,
          type: 'task.delete',
          message: `Deleted task: ${existing.title}`,
          metadata: { taskId: existing.id },
        },
      })
    }

    res.json({ success: true, message: 'Task deleted successfully' })
  } catch (error) {
    next(error)
  }
})

export default router
