export type Intent = 'company' | 'sales' | 'marketing' | 'finance' | 'hr' | 'operations' | 'knowledge' | 'tasks' | 'general'

export type IntelligenceDecision = {
  intent: Intent
  action: 'answer' | 'retrieve' | 'delegate'
  agentSlug?: string
  confidence: number
  reason: string
}
