import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { setupRateLimiting } from './middleware/rateLimit.js'
import { errorHandler } from './middleware/errorHandler.js'
import { setupWebSocket } from './services/websocket.js'
import authRoutes from './routes/auth.js'
import accountRoutes from './routes/account.js'
import notificationsRoutes from './routes/notifications.js'
import companyRoutes from './routes/company.js'
import agentRoutes from './routes/agents.js'
import taskRoutes from './routes/tasks.js'
import knowledgeRoutes from './routes/knowledge.js'
import intelligenceRoutes from './routes/intelligence.js'

const app = express()
const server = createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })

app.use(helmet({ contentSecurityPolicy: false, hsts: { maxAge: 31536000, includeSubDomains: true, preload: true } }))
app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin === process.env.FRONTEND_URL) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
setupRateLimiting(app)

app.get(['/health', '/api/health'], (_req, res) => res.json({ status: 'ok', service: 'companyos-api', timestamp: new Date().toISOString() }))
app.use('/api/auth', authRoutes)
app.use('/api/account', accountRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api/company', companyRoutes)
app.use('/api/agents', agentRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/knowledge', knowledgeRoutes)
app.use('/api/intelligence', intelligenceRoutes)
app.use(errorHandler)

setupWebSocket(wss)

const PORT = Number(process.env.PORT) || 4000
server.listen(PORT, '0.0.0.0', () => console.log(`CompanyOS API running on port ${PORT}`))
process.on('SIGTERM', () => server.close(() => process.exit(0)))
