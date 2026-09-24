import { Router } from 'express'
import crypto from 'crypto'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.post('/tickets', authenticate, async (_req, res) => { res.json({ ticketId: crypto.randomUUID() }) })
router.get('/tickets', authenticate, async (_req, res) => { res.json([]) })

export default router
