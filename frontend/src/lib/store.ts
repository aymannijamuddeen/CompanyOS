import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Company { id: string; name: string; slug: string; description?: string | null }
export interface User { id: string; username: string; email: string; role: string }

interface AuthState {
  user: User | null
  company: Company | null
  isAuthenticated: boolean
  token: string | null
  setSession: (user: User, company: Company | null, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(persist((set) => ({
  user: null,
  company: null,
  isAuthenticated: false,
  token: null,
  setSession: (user, company, token) => set({ user, company, token, isAuthenticated: true }),
  logout: () => set({ user: null, company: null, token: null, isAuthenticated: false }),
}), { name: 'companyos-auth' }))

interface NotificationState {
  notifications: any[]
  unreadCount: number
  addNotification: (notification: any) => void
  markAsRead: (id: string) => void
}
export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [], unreadCount: 0,
  addNotification: (notification) => set((s) => ({ notifications: [notification, ...s.notifications], unreadCount: s.unreadCount + 1 })),
  markAsRead: (id) => set((s) => ({ notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true } : n), unreadCount: Math.max(0, s.unreadCount - 1) })),
}))
