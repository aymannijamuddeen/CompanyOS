import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.patch('/profile', authenticate, async (_req, res) => { res.json({ message: 'Profile updated' }) })
router.patch('/password', authenticate, async (_req, res) => { res.json({ message: 'Password changed' }) })
router.get('/sessions', authenticate, async (_req, res) => { res.json([]) })
router.delete('/sessions/:id', authenticate, async (_req, res) => { res.json({ message: 'Session revoked' }) })
router.put('/limits', authenticate, async (_req, res) => { res.json({ message: 'Limit set' }) })
router.post('/self-exclude', authenticate, async (_req, res) => { res.json({ message: 'Self-exclusion activated' }) })
router.post('/2fa/enable', authenticate, async (_req, res) => { res.json({ qrCode: '', secret: '' }) })
router.post('/2fa/confirm', authenticate, async (_req, res) => { res.json({ message: '2FA enabled' }) })

export default router
