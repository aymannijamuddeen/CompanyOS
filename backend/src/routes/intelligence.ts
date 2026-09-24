import { Router } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth.js'
import { answerCompanyQuestion, listExecutions } from '../services/intelligence/orchestrator.js'

const router = Router()

router.post('/ask', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.companyId || !req.userId) return res.status(400).json({ message: 'No company context' })
    const { question, conversationId } = req.body
    if (!question || typeof question !== 'string' || question.trim().length < 2) return res.status(400).json({ message: 'question is required' })
    if (question.length > 10000) return res.status(400).json({ message: 'question is too long' })
    res.json(await answerCompanyQuestion({ companyId: req.companyId, userId: req.userId, question: question.trim(), conversationId }))
  } catch (error) { next(error) }
})

router.get('/executions', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.companyId) return res.status(400).json({ message: 'No company context' })
    const limit = Math.min(Number(req.query.limit) || 30, 100)
    res.json(await listExecutions(req.companyId, limit))
  } catch (error) { next(error) }
})

export default router
