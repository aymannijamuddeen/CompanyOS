import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, AuthRequest } from '../middleware/auth.js'
import { getCompanyContext } from '../services/companyContext.js'

const router = Router()
const prisma = new PrismaClient()

router.get('/context', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.companyId) return res.status(400).json({ message: 'No company selected' })
    res.json(await getCompanyContext(req.companyId))
  } catch (error) { next(error) }
})

router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.companyId) return res.status(400).json({ message: 'No company selected' })
    const company = await prisma.company.findUnique({ where: { id: req.companyId } })
    if (!company) return res.status(404).json({ message: 'Company not found' })
    res.json(company)
  } catch (error) { next(error) }
})

export default router
