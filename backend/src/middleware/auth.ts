import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface AuthRequest extends Request {
  userId?: string
  companyId?: string
  user?: any
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ message: 'No token provided' })
    const token = authHeader.substring(7)
    const jwtSecret = process.env.JWT_SECRET || 'companyos-dev-super-secret-jwt-key'
    const decoded = jwt.verify(token, jwtSecret) as { userId: string; role?: string }
    req.userId = decoded.userId

    const headerCompanyId = req.headers['x-company-id'] as string | undefined
    let membership = null

    if (headerCompanyId) {
      membership = await prisma.membership.findFirst({
        where: { userId: decoded.userId, companyId: headerCompanyId },
      })
    }

    if (!membership) {
      membership = await prisma.membership.findFirst({
        where: { userId: decoded.userId },
        orderBy: { createdAt: 'asc' },
      })
    }

    if (membership) {
      req.companyId = membership.companyId
    }

    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) return res.status(401).json({ message: 'Token expired' })
    return res.status(401).json({ message: 'Invalid token' })
  }
}

export function requireRole(...roles: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) return res.status(401).json({ message: 'Not authenticated' })
      const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { role: true } })
      if (!user || !roles.includes(user.role)) return res.status(403).json({ message: 'Insufficient permissions' })
      req.user = user
      next()
    } catch {
      return res.status(401).json({ message: 'Authentication failed' })
    }
  }
}
