import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, AuthRequest } from '../middleware/auth.js'
import { getCompanyContext } from '../services/companyContext.js'
import { synthesizeAgentResponse } from '../services/intelligence/agentSynthesizer.js'
import { initializeCompanyDefaults } from '../services/companyDefaults.js'

const router = Router()
const prisma = new PrismaClient()

router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    let companyId = req.companyId
    if (!companyId && req.userId) {
      const m = await prisma.membership.findFirst({ where: { userId: req.userId }, orderBy: { createdAt: 'asc' } })
      if (m) companyId = m.companyId
    }
    if (!companyId) return res.status(400).json({ message: 'No company selected' })

    let agents = await prisma.agent.findMany({
      where: { companyId },
      include: { department: true },
      orderBy: { createdAt: 'asc' },
    })

    if (agents.length === 0) {
      await initializeCompanyDefaults(prisma, companyId, req.userId)
      agents = await prisma.agent.findMany({
        where: { companyId },
        include: { department: true },
        orderBy: { createdAt: 'asc' },
      })
    }

    res.json(agents)
  } catch (error) { next(error) }
})

router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.companyId) return res.status(400).json({ message: 'No company selected' })
    const agent = await prisma.agent.findFirst({
      where: { id: req.params.id, companyId: req.companyId },
      include: { department: true },
    })
    if (!agent) return res.status(404).json({ message: 'Agent not found' })
    res.json(agent)
  } catch (error) { next(error) }
})

router.get('/:id/conversation', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.companyId || !req.userId) return res.status(400).json({ message: 'No company context' })

    const agent = await prisma.agent.findFirst({
      where: { id: req.params.id, companyId: req.companyId },
    })
    if (!agent) return res.status(404).json({ message: 'Agent not found' })

    // Find conversation dedicated to this agent
    const convTitle = `agent:${agent.id}`
    let conversation = await prisma.conversation.findFirst({
      where: {
        companyId: req.companyId,
        userId: req.userId,
        title: convTitle,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          companyId: req.companyId,
          userId: req.userId,
          title: convTitle,
        },
        include: {
          messages: true,
        },
      })
    }

    res.json(conversation)
  } catch (error) { next(error) }
})

router.post('/:id/chat', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.companyId || !req.userId) return res.status(400).json({ message: 'No company context' })

    const { message } = req.body
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' })
    }

    const agent = await prisma.agent.findFirst({
      where: { id: req.params.id, companyId: req.companyId },
      include: { department: true },
    })
    if (!agent) return res.status(404).json({ message: 'Agent not found' })

    const [user, company, context] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.userId } }),
      prisma.company.findUnique({ where: { id: req.companyId } }),
      getCompanyContext(req.companyId),
    ])

    if (!user || !company) return res.status(404).json({ message: 'Context not found' })

    const convTitle = `agent:${agent.id}`
    let conversation = await prisma.conversation.findFirst({
      where: { companyId: req.companyId, userId: req.userId, title: convTitle },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 20 } },
    })

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { companyId: req.companyId, userId: req.userId, title: convTitle },
        include: { messages: true },
      })
    }

    // 1. Record user message
    const userMsg = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        userId: req.userId,
        role: 'user',
        content: message.trim(),
      },
    })

    // 2. Start AgentExecution
    const execution = await prisma.agentExecution.create({
      data: {
        agentId: agent.id,
        userId: req.userId,
        status: 'running',
        startedAt: new Date(),
        input: { message: message.trim(), conversationId: conversation.id },
      },
    })

    // 3. Synthesize response
    const history = conversation.messages.map((m) => ({ role: m.role, content: m.content }))
    const result = await synthesizeAgentResponse({
      agent,
      user,
      company,
      context,
      message: message.trim(),
      conversationHistory: history,
    })

    // 4. Save agent message
    const agentMsg = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: result.answer,
        metadata: {
          agentId: agent.id,
          agentName: agent.name,
          agentSlug: agent.slug,
          executionId: execution.id,
          citations: result.citations,
        },
      },
    })

    // 5. Complete AgentExecution
    await prisma.agentExecution.update({
      where: { id: execution.id },
      data: {
        status: 'completed',
        output: { answer: result.answer, citations: result.citations, routeUsed: result.routeUsed },
        completedAt: new Date(),
      },
    })

    // 6. Record activity
    await prisma.activity.create({
      data: {
        companyId: req.companyId,
        actorId: req.userId,
        type: 'agent.chat',
        message: `Chatted with ${agent.name}`,
        metadata: { agentId: agent.id, executionId: execution.id },
      },
    })

    res.json({
      answer: result.answer,
      citations: result.citations,
      executionId: execution.id,
      userMessage: userMsg,
      agentMessage: agentMsg,
      conversationId: conversation.id,
      agent: {
        id: agent.id,
        name: agent.name,
        slug: agent.slug,
        type: agent.type,
        department: agent.department?.name,
      },
    })
  } catch (error) { next(error) }
})

router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.companyId) return res.status(400).json({ message: 'No company selected' })
    const { name, slug, description, type = 'specialist', systemPrompt } = req.body
    if (!name || !slug) return res.status(400).json({ message: 'name and slug are required' })
    const agent = await prisma.agent.create({ data: { companyId: req.companyId, name, slug, description, type, systemPrompt } })
    res.status(201).json(agent)
  } catch (error) { next(error) }
})

export default router
