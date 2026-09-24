import { Express } from 'express'
import rateLimit from 'express-rate-limit'

export const redisClient = null

export function setupRateLimiting(app: Express) {
  // Global API rate limit - in-memory standard store
  const globalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 200, // 200 requests per minute per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests from this IP, please try again later.' },
  })

  app.use('/api/', globalLimiter)

  return {
    loginLimiter: rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 20,
      skipSuccessfulRequests: true,
      keyGenerator: (req) => {
        const username = req.body?.email || req.ip || 'unknown'
        return `${req.ip}:${username}`
      },
      message: { message: 'Too many login attempts, please try again later.' },
    }),

    registerLimiter: rateLimit({
      windowMs: 60 * 60 * 1000,
      max: 50,
      message: { message: 'Too many accounts created, please try again later.' },
    }),
  }
}
