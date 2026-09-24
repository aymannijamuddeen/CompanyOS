import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import speakeasy from 'speakeasy'
import crypto from 'crypto'
import { initializeCompanyDefaults } from '../services/companyDefaults.js'
import { hashPassword, verifyPassword, hashToken } from '../services/password.js'
import { authenticate, AuthRequest } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password, companyName } = req.body

    if (!username || !email || !password || !companyName) {
      return res.status(400).json({ message: 'Username, email, password, and company name are required' })
    }

    const cleanUsername = String(username).trim()
    const cleanEmail = String(email).trim().toLowerCase()
    const cleanCompanyName = String(companyName).trim()

    if (cleanUsername.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters long' })
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address' })
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' })
    }

    const existingEmail = await prisma.user.findUnique({ where: { email: cleanEmail } })
    if (existingEmail) {
      return res.status(409).json({ message: 'An account with this email already exists' })
    }

    const existingUser = await prisma.user.findUnique({ where: { username: cleanUsername } })
    if (existingUser) {
      return res.status(409).json({ message: 'Username is already taken' })
    }

    const passwordHash = await hashPassword(password)
    const baseSlug = cleanCompanyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'company'
    const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`

    const jwtSecret = process.env.JWT_SECRET || 'companyos-dev-super-secret-jwt-key'
    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'companyos-dev-super-secret-refresh-key'

    const { user, company, token, refreshToken } = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          username: cleanUsername,
          email: cleanEmail,
          passwordHash,
          role: 'owner',
        },
      })

      const newCompany = await tx.company.create({
        data: {
          name: cleanCompanyName,
          slug,
        },
      })

      await tx.membership.create({
        data: {
          userId: newUser.id,
          companyId: newCompany.id,
          role: 'owner',
        },
      })

      // Initialize default departments and agents (CEO, Sales, Marketing, Finance, HR, Operations)
      await initializeCompanyDefaults(tx, newCompany.id, newUser.id)

      const tok = jwt.sign(
        { userId: newUser.id, role: newUser.role },
        jwtSecret,
        { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
      )

      const refTok = jwt.sign(
        { userId: newUser.id },
        refreshSecret,
        { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any }
      )

      await tx.session.create({
        data: {
          userId: newUser.id,
          ipAddress: req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || '',
          refreshTokenHash: hashToken(refTok),
        },
      })

      return { user: newUser, company: newCompany, token: tok, refreshToken: refTok }
    })

    return res.status(201).json({
      message: 'Company and account created successfully',
      token,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        description: company.description,
      },
    })
  } catch (error) {
    next(error)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const { email, password, twoFactorCode } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const cleanEmail = String(email).trim().toLowerCase()
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } })
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        return res.status(401).json({ message: '2FA required' })
      }
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret!,
        encoding: 'base32',
        token: twoFactorCode,
      })
      if (!verified) {
        return res.status(401).json({ message: 'Invalid 2FA code' })
      }
    }

    const membership = await prisma.membership.findFirst({
      where: { userId: user.id },
      include: { company: true },
      orderBy: { createdAt: 'asc' },
    })

    if (membership?.companyId) {
      await initializeCompanyDefaults(prisma, membership.companyId, user.id)
    }

    const jwtSecret = process.env.JWT_SECRET || 'companyos-dev-super-secret-jwt-key'
    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'companyos-dev-super-secret-refresh-key'

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      jwtSecret,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
    )

    const refreshToken = jwt.sign(
      { userId: user.id },
      refreshSecret,
      { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any }
    )

    await prisma.session.create({
      data: {
        userId: user.id,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || '',
        refreshTokenHash: hashToken(refreshToken),
      },
    })

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: req.ip || 'unknown',
      },
    })

    return res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      company: membership?.company ?? null,
    })
  } catch (error) {
    next(error)
  }
})

router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'companyos-dev-super-secret-jwt-key') as { userId: string }
        await prisma.session.updateMany({
          where: { userId: decoded.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        })
      } catch {
        // Token might already be expired
      }
    }
  } catch {
    // Ignore
  }
  return res.json({ message: 'Logged out successfully' })
})

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return res.status(400).json({ message: 'Refresh token is required' })

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'companyos-dev-super-secret-refresh-key') as { userId: string }
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } })
    if (!user) return res.status(401).json({ message: 'User not found' })

    const newToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'companyos-dev-super-secret-jwt-key',
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
    )
    return res.json({ token: newToken })
  } catch (error) {
    next(error)
  }
})

router.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, username: true, email: true, role: true, status: true },
    })
    if (!user) return res.status(404).json({ message: 'User not found' })

    const membership = await prisma.membership.findFirst({
      where: { userId: user.id },
      include: { company: true },
      orderBy: { createdAt: 'asc' },
    })

    return res.json({ user, company: membership?.company ?? null })
  } catch (error) {
    next(error)
  }
})

export default router
