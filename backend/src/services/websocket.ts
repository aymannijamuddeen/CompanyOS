import { WebSocketServer, WebSocket } from 'ws'
import jwt from 'jsonwebtoken'

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string
  isAlive?: boolean
}

const clients = new Map<string, AuthenticatedWebSocket>()

export function setupWebSocket(wss: WebSocketServer) {
  // Heartbeat to detect dead connections
  const interval = setInterval(() => {
    wss.clients.forEach((ws: any) => {
      if (ws.isAlive === false) {
        ws.terminate()
        return
      }
      ws.isAlive = false
      ws.ping()
    })
  }, 30000)

  wss.on('connection', (ws: AuthenticatedWebSocket, req) => {
    ws.isAlive = true

    // Authenticate via token in query string
    const url = new URL(req.url!, `ws://localhost`)
    const token = url.searchParams.get('token')

    if (!token) {
      ws.close(1008, 'Authentication required')
      return
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
      ws.userId = decoded.userId
      clients.set(decoded.userId, ws)

      console.log(`WebSocket: User ${decoded.userId} connected`)
    } catch (error) {
      ws.close(1008, 'Invalid token')
      return
    }

    ws.on('pong', () => {
      ws.isAlive = true
    })

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString())
        handleMessage(ws, message)
      } catch (error) {
        console.error('WebSocket message error:', error)
      }
    })

    ws.on('close', () => {
      if (ws.userId) {
        clients.delete(ws.userId)
        console.log(`WebSocket: User ${ws.userId} disconnected`)
      }
    })

    // Send initial connection confirmation
    ws.send(JSON.stringify({
      type: 'connected',
      data: { message: 'Connected to live feed' }
    }))
  })

  wss.on('close', () => {
    clearInterval(interval)
  })
}

function handleMessage(_ws: AuthenticatedWebSocket, message: any) {
  // Handle client messages if needed (e.g., subscribe to specific channels)
  console.log('WebSocket message:', message)
}

// Broadcast to specific user
export function sendToUser(userId: string, type: string, data: any) {
  const client = clients.get(userId)
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify({ type, data }))
  }
}

// Broadcast to all connected clients
export function broadcast(type: string, data: any) {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type, data }))
    }
  })
}

