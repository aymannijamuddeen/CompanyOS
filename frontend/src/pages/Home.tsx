import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'

export default function Home() {
  const [context, setContext] = useState<any>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<any>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.getContext().then(setContext).catch(console.error)
  }, [])

  async function ask() {
    const q = question.trim()
    if (!q) return
    setError('')
    setLoading(true)
    try {
      const res = await api.ask(q)
      setAnswer(res)
    } catch (e: any) {
      setError(e.message || 'Failed to get answer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <section className="card" style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.6 }}>Company Intelligence</div>
        <h1 style={{ fontSize: 36, margin: '8px 0', fontWeight: 700 }}>Ask your company anything.</h1>
        <p style={{ opacity: 0.7, marginBottom: 20 }}>
          CompanyOS understands the request, loads company context, retrieves knowledge, and routes work to the right agent.
        </p>

        {error && (
          <div className="badge badge-error" style={{ padding: '10px 14px', marginBottom: 16, display: 'block', textTransform: 'none' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <input
            className="input"
            style={{ flex: 1, padding: '12px 16px', fontSize: 15 }}
            placeholder="e.g. What is our operating mission and what tasks need attention?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && ask()}
          />
          <button className="btn btn-primary" onClick={ask} disabled={loading} style={{ padding: '0 28px' }}>
            {loading ? 'Thinking...' : 'Ask'}
          </button>
        </div>

        {/* Dedicated Agent Chat Quick Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 16, fontSize: 13 }}>
          <span style={{ opacity: 0.6 }}>Or chat directly with an agent:</span>
          {[
            { name: 'CEO', slug: 'ceo', color: '#6366f1' },
            { name: 'Sales', slug: 'sales', color: '#10b981' },
            { name: 'Marketing', slug: 'marketing', color: '#f59e0b' },
            { name: 'Finance', slug: 'finance', color: '#3b82f6' },
            { name: 'HR', slug: 'hr', color: '#ec4899' },
            { name: 'Operations', slug: 'operations', color: '#8b5cf6' },
          ].map((ag) => (
            <Link
              key={ag.slug}
              to={`/agents?agent=${ag.slug}`}
              style={{
                textDecoration: 'none',
                padding: '4px 10px',
                borderRadius: 12,
                background: 'var(--surface-raised)',
                color: 'var(--text-primary)',
                border: 'var(--border-subtle)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontWeight: 500,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: ag.color }} />
              {ag.name} Agent
            </Link>
          ))}
        </div>

        {answer && (
          <div className="card card-raised" style={{ marginTop: 24, padding: 22, background: 'var(--surface-raised)', border: 'var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-accent)' }} />
              <strong style={{ fontSize: 15, color: 'var(--text-primary)' }}>CompanyOS Intelligence</strong>
              {answer.agent && (
                <span style={{ fontSize: 12, opacity: 0.8, color: 'var(--text-secondary)' }}>
                  · {answer.agent.name}
                </span>
              )}
            </div>

            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: 15, color: 'var(--text-primary)' }}>
              {answer.answer || answer.data?.answer || 'Response generated successfully.'}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
              {(answer.intent || answer.decision?.intent) && (
                <span className="badge">Route: {answer.intent || answer.decision?.intent}</span>
              )}
              {answer.agent?.name && (
                <span className="badge" style={{ background: 'rgba(232, 163, 61, 0.2)', color: 'var(--color-accent)', fontWeight: 600 }}>
                  Agent: {answer.agent.name}
                </span>
              )}
              {answer.decision?.confidence && (
                <span className="badge">Confidence: {Math.round(answer.decision.confidence * 100)}%</span>
              )}
              {(answer.agent?.slug || answer.decision?.agentSlug) && (
                <Link
                  to={`/agents?agent=${answer.agent?.slug || answer.decision?.agentSlug}`}
                  className="badge"
                  style={{ textDecoration: 'none', background: 'rgba(59, 130, 196, 0.2)', color: '#7cb5ec', fontWeight: 600 }}
                >
                  💬 Continue with {((answer.agent?.slug || answer.decision?.agentSlug) ?? '').toUpperCase()} Agent →
                </Link>
              )}
            </div>

            {((answer.sources && answer.sources.length > 0) || (answer.evidence && answer.evidence.length > 0)) && (
              <div style={{ marginTop: 18, paddingTop: 14, borderTop: 'var(--border-subtle)' }}>
                <div style={{ opacity: 0.6, fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Retrieved Knowledge Sources
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(answer.sources || answer.evidence).map((item: any) => (
                    <div key={item.documentId} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)' }}>
                      <span>📄</span>
                      <strong>{item.title}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {[
          ['Agents', context?.agents?.length ?? 0],
          ['Open tasks', context?.tasks?.filter((t: any) => t.status !== 'done').length ?? 0],
          ['Knowledge docs', context?.documents?.length ?? 0],
          ['Customers', context?.customers ?? 0],
        ].map(([label, value]) => (
          <div className="card" key={String(label)} style={{ padding: 20 }}>
            <div style={{ opacity: 0.6 }}>{label}</div>
            <div style={{ fontSize: 30, fontWeight: 700, marginTop: 8 }}>{value}</div>
          </div>
        ))}
      </div>
    </main>
  )
}
