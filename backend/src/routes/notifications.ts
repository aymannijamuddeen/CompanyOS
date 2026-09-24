import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, AuthRequest } from '../middleware/auth.js'
const router = Router()
const prisma = new PrismaClient()
router.get('/', authenticate, async (req: AuthRequest, res, next) => { try { const rows = await prisma.notification.findMany({ where: { userId: req.userId }, orderBy: { createdAt: 'desc' }, take: 50 }); res.json(rows) } catch (e) { next(e) } })
router.patch('/:id/read', authenticate, async (req: AuthRequest, res, next) => { try { const row = await prisma.notification.updateMany({ where: { id: req.params.id, userId: req.userId }, data: { read: true } }); res.json({ updated: row.count }) } catch (e) { next(e) } })
export default router
