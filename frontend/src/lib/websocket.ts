import { useAuthStore } from './store'

export function connectWebSocket(onEvent: (event: any) => void) {
  const token = useAuthStore.getState().token
  if (!token) return null

  const ws = new WebSocket(
    `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws?token=${encodeURIComponent(token)}`
  )

  ws.onmessage = (e) => {
    try {
      onEvent(JSON.parse(e.data))
    } catch (err) {
      console.error('WebSocket parse error:', err)
    }
  }

  return ws
}
