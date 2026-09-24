import { useAuthStore } from './store'

class APIClient {
  private baseURL = '/api'

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = useAuthStore.getState().token
    const company = useAuthStore.getState().company
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (token) headers['Authorization'] = `Bearer ${token}`
    if (company?.id) headers['x-company-id'] = company.id

    const response = await fetch(`${this.baseURL}${endpoint}`, { ...options, headers })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }))
      if (response.status === 401) {
        useAuthStore.getState().logout()
        if (typeof window !== 'undefined' && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login'
        }
      }
      throw new Error(error.message || `Request failed with status ${response.status}`)
    }
    return response.json()
  }

  login(email: string, password: string, twoFactorCode?: string) {
    return this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, twoFactorCode }),
    })
  }

  register(username: string, email: string, password: string, companyName: string) {
    return this.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, companyName }),
    })
  }

  logout() {
    return this.request<any>('/auth/logout', { method: 'POST' }).catch(() => {})
  }

  getMe() {
    return this.request<any>('/auth/me')
  }

  getCompany() { return this.request<any>('/company') }
  getContext() { return this.request<any>('/company/context') }
  getAgents() { return this.request<any>('/agents').then((res) => (Array.isArray(res) ? res : res.data || [])) }
  getAgent(id: string) { return this.request<any>(`/agents/${id}`).then((res) => res?.data || res) }
  getAgentConversation(id: string) { return this.request<any>(`/agents/${id}/conversation`) }
  sendAgentMessage(id: string, message: string) { return this.request<any>(`/agents/${id}/chat`, { method: 'POST', body: JSON.stringify({ message }) }) }
  createAgent(data: any) { return this.request<any>('/agents', { method: 'POST', body: JSON.stringify(data) }).then((res) => res?.data || res) }
  getTasks(params?: { status?: string; priority?: string; search?: string }) {
    const query = new URLSearchParams()
    if (params?.status && params.status !== 'all') query.set('status', params.status)
    if (params?.priority && params.priority !== 'all') query.set('priority', params.priority)
    if (params?.search) query.set('search', params.search)
    const qs = query.toString() ? `?${query.toString()}` : ''
    return this.request<any>(`/tasks${qs}`).then((res) => (Array.isArray(res) ? res : res?.data || []))
  }
  getTask(id: string) { return this.request<any>(`/tasks/${id}`).then((res) => res?.data || res) }
  createTask(data: any) { return this.request<any>('/tasks', { method: 'POST', body: JSON.stringify(data) }).then((res) => res?.data || res) }
  updateTask(id: string, data: any) { return this.request<any>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }).then((res) => res?.data || res) }
  deleteTask(id: string) { return this.request<any>(`/tasks/${id}`, { method: 'DELETE' }) }
  getDocuments() { return this.request<any>('/knowledge').then((res) => (Array.isArray(res) ? res : res?.data || [])) }
  getDocument(id: string) { return this.request<any>(`/knowledge/${id}`).then((res) => res?.data || res) }
  addDocument(data: any) { return this.request<any>('/knowledge', { method: 'POST', body: JSON.stringify(data) }).then((res) => res?.data || res) }
  deleteDocument(id: string) { return this.request<any>(`/knowledge/${id}`, { method: 'DELETE' }) }
  ask(question: string, conversationId?: string) { return this.request<any>('/intelligence/ask', { method: 'POST', body: JSON.stringify({ question, conversationId }) }) }
  getIntelligenceExecutions(limit = 30) { return this.request<any>(`/intelligence/executions?limit=${limit}`).then((res) => (Array.isArray(res) ? res : res?.data || [])) }
  getNotifications() { return this.request<any[]>('/notifications') }
}

export const api = new APIClient()
