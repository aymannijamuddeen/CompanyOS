import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '@/lib/api'

interface Agent {
  id: string
  name: string
  slug: string
  type: string
  status: string
  description?: string
  systemPrompt?: string
  department?: { id: string; name: string }
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt?: string
  metadata?: any
}

const AGENT_COLORS: Record<string, string> = {
  ceo: '#6366f1',
  sales: '#10b981',
  marketing: '#f59e0b',
  finance: '#3b82f6',
  hr: '#ec4899',
  operations: '#8b5cf6',
}

const AGENT_SUGGESTIONS: Record<string, string[]> = {
  ceo: [
    'Give me an executive briefing on company status.',
    'What strategic priorities need my attention today?',
    'What is our company operating mission?',
  ],
  sales: [
    'What deals and enterprise accounts are in our pipeline?',
    'How can we accelerate enterprise deal velocity?',
    'What is our commercial strategy for new clients?',
  ],
  marketing: [
    'What are our current demand generation priorities?',
    'How should we position CompanyOS against legacy platforms?',
    'What content initiatives should we launch this month?',
  ],
  finance: [
    'What is our target gross margin and financial policy?',
    'Review our monthly burn rate and unit economics audit.',
    'What financial controls are in place for SaaS spend?',
  ],
  hr: [
    'What headcount and hiring initiatives are underway?',
    'What is our policy on opening new job requisitions?',
    'How do we ensure cross-functional alignment in hiring?',
  ],
  operations: [
    'Where are our primary workflow bottlenecks?',
    'What tasks are currently open across the company?',
    'How can we improve throughput between support and engineering?',
  ],
}

export default function Agents() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [chatLoading, setChatLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const loadAgents = () => {
    setLoading(true)
    setError('')
    api.getAgents()
      .then((data: any[]) => {
        setAgents(data)
        const targetSlug = searchParams.get('agent') || 'ceo'
        const found = data.find((a: any) => a.slug === targetSlug) || data[0]
        if (found) setSelectedAgent(found)
      })
      .catch((e) => setError(e.message || 'Failed to load agents'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadAgents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load conversation when selectedAgent changes
  useEffect(() => {
    if (!selectedAgent) return
    setError('')
    setChatLoading(true)
    api.getAgentConversation(selectedAgent.id)
      .then((conv) => {
        setMessages(conv.messages || [])
      })
      .catch((e) => {
        console.error('Failed to load conversation:', e)
        setMessages([])
      })
      .finally(() => setChatLoading(false))
  }, [selectedAgent])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const selectAgent = (agent: Agent) => {
    setSelectedAgent(agent)
    setSearchParams({ agent: agent.slug })
  }

  const sendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim()
    if (!text || !selectedAgent || chatLoading) return

    setInputMessage('')
    setError('')
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMsg])
    setChatLoading(true)

    try {
      const res = await api.sendAgentMessage(selectedAgent.id, text)
      const assistantMsg: Message = {
        id: res.agentMessage?.id || `res-${Date.now()}`,
        role: 'assistant',
        content: res.answer,
        createdAt: new Date().toISOString(),
        metadata: { citations: res.citations },
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (e: any) {
      setError(e.message || 'Failed to get answer from agent')
    } finally {
      setChatLoading(false)
    }
  }

  const suggestions = selectedAgent ? (AGENT_SUGGESTIONS[selectedAgent.slug] || [
    'What tasks are assigned to you?',
    'What is your role and how do you help the company?',
  ]) : []

  return (
    <main style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 32px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Agent Command Center</h1>
        <p style={{ color: 'var(--text-secondary, #666)', margin: '4px 0 0 0' }}>
          Direct, specialized chat sections for each autonomous agent in your company workspace.
        </p>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 18px',
            background: '#fee2e2',
            color: '#991b1b',
            borderRadius: 8,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{error}</span>
          {error.toLowerCase().includes('token') || error.toLowerCase().includes('401') ? (
            <button
              className="btn btn-primary"
              style={{ padding: '6px 14px', fontSize: 13 }}
              onClick={() => {
                api.logout()
                window.location.href = '/login'
              }}
            >
              Sign in again
            </button>
          ) : (
            <button
              className="btn"
              style={{ padding: '6px 14px', fontSize: 13 }}
              onClick={loadAgents}
            >
              Retry
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>Loading agents...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, minHeight: '680px' }}>
          {/* LEFT: Agent Roster */}
          <aside className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.6, padding: '4px 8px' }}>
              Company Agents ({agents.length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
              {agents.map((agent) => {
                const isSelected = selectedAgent?.id === agent.id
                const color = AGENT_COLORS[agent.slug] || '#6366f1'

                return (
                  <button
                    key={agent.id}
                    onClick={() => selectAgent(agent)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: isSelected ? `2px solid ${color}` : 'var(--border-subtle)',
                      background: isSelected ? 'var(--surface-raised)' : 'transparent',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      width: '100%',
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        background: color,
                        color: '#fff',
                        fontWeight: 700,
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 14,
                        flexShrink: 0,
                      }}
                    >
                      {agent.slug.slice(0, 2).toUpperCase()}
                    </div>

                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)' }}>
                        <span>{agent.name}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {agent.department?.name || agent.type}
                      </div>
                    </div>

                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: '#10b981',
                        flexShrink: 0,
                      }}
                      title="Active"
                    />
                  </button>
                )
              })}

              {agents.length === 0 && !loading && (
                <div style={{ padding: '24px 8px', textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                    No agents loaded.
                  </p>
                  <button className="btn btn-primary" style={{ fontSize: 12, padding: '6px 14px' }} onClick={loadAgents}>
                    Load Agents
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* RIGHT: Dedicated Agent Chat Section */}
          <section className="card" style={{ display: 'flex', flexDirection: 'column', height: '700px', overflow: 'hidden', padding: 0 }}>
            {selectedAgent ? (
              <>
                {/* Chat Header */}
                <div
                  style={{
                    padding: '16px 24px',
                    borderBottom: 'var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--surface-card)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: AGENT_COLORS[selectedAgent.slug] || '#6366f1',
                        color: '#fff',
                        fontWeight: 700,
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 16,
                      }}
                    >
                      {selectedAgent.slug.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{selectedAgent.name}</h2>
                        <span
                          style={{
                            fontSize: 11,
                            padding: '2px 8px',
                            borderRadius: 12,
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: '#10b981',
                            fontWeight: 600,
                          }}
                        >
                          ● Online & Active
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary, #666)', marginTop: 2 }}>
                        {selectedAgent.description}
                      </div>
                    </div>
                  </div>

                  <span className="badge" style={{ textTransform: 'capitalize' }}>
                    {selectedAgent.department?.name || 'Department'}
                  </span>
                </div>

                {/* Message Thread */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}
                >
                  {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', margin: 'auto', maxWidth: 440, color: 'var(--text-secondary, #666)' }}>
                      <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
                      <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 6px 0' }}>
                        Start a conversation with {selectedAgent.name}
                      </h3>
                      <p style={{ fontSize: 13, margin: 0 }}>
                        Ask questions about this agent's domain, review tasks, or request strategic analysis.
                      </p>
                    </div>
                  ) : (
                    messages.map((msg, i) => {
                      const isUser = msg.role === 'user'
                      return (
                        <div
                          key={msg.id || i}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isUser ? 'flex-end' : 'flex-start',
                          }}
                        >
                          <div style={{ fontSize: 11, color: 'var(--text-secondary, #888)', marginBottom: 4, padding: '0 4px' }}>
                            {isUser ? 'You' : selectedAgent.name}
                          </div>

                          <div
                            style={{
                              maxWidth: '82%',
                              padding: '12px 18px',
                              borderRadius: 14,
                              background: isUser ? 'var(--color-accent)' : 'var(--surface-raised)',
                              color: isUser ? '#000' : 'var(--text-primary)',
                              fontSize: 14,
                              lineHeight: 1.6,
                              whiteSpace: 'pre-wrap',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                              border: isUser ? 'none' : 'var(--border-subtle)',
                            }}
                          >
                            {msg.content}
                          </div>

                          {msg.metadata?.citations?.length > 0 && (
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6, padding: '0 4px' }}>
                              <span style={{ fontSize: 11, opacity: 0.6, color: 'var(--text-secondary)' }}>Sources:</span>
                              {msg.metadata.citations.map((c: string, idx: number) => (
                                <span
                                  key={idx}
                                  style={{
                                    fontSize: 11,
                                    background: 'var(--surface-raised)',
                                    color: 'var(--text-primary)',
                                    padding: '2px 8px',
                                    borderRadius: 8,
                                    border: 'var(--border-subtle)',
                                  }}
                                >
                                  {c}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}

                  {chatLoading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 13, padding: '6px 12px' }}>
                      <span className="spinner" style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'var(--color-accent)', animation: 'spin 1s linear infinite' }} />
                      <span>{selectedAgent.name} is thinking...</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Prompts */}
                {suggestions.length > 0 && (
                  <div
                    style={{
                      padding: '8px 20px',
                      borderTop: 'var(--border-subtle)',
                      display: 'flex',
                      gap: 8,
                      overflowX: 'auto',
                      background: 'var(--surface-base)',
                    }}
                  >
                    {suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => sendMessage(s)}
                        disabled={chatLoading}
                        className="btn btn-secondary"
                        style={{
                          fontSize: 12,
                          padding: '6px 14px',
                          borderRadius: 16,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        💡 {s}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    sendMessage()
                  }}
                  style={{
                    padding: '16px 20px',
                    borderTop: 'var(--border-subtle)',
                    display: 'flex',
                    gap: 12,
                    background: 'var(--surface-card)',
                  }}
                >
                  <input
                    className="input"
                    style={{ flex: 1, padding: '12px 16px', fontSize: 14 }}
                    placeholder={`Message ${selectedAgent.name}...`}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    disabled={chatLoading}
                  />
                  <button
                    className="btn btn-primary"
                    type="submit"
                    disabled={chatLoading || !inputMessage.trim()}
                    style={{ padding: '0 24px' }}
                  >
                    {chatLoading ? 'Sending...' : 'Send'}
                  </button>
                </form>
              </>
            ) : (
              <div style={{ margin: 'auto', textAlign: 'center', color: '#888' }}>
                Select an agent on the left to open their chat section.
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  )
}
