import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'

export default function Company() {
  const [context, setContext] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    api.getContext()
      .then((data) => setContext(data))
      .catch((err) => setError(err.message || 'Failed to load company details'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px', textAlign: 'center', opacity: 0.7 }}>
        Loading company profile...
      </main>
    )
  }

  const company = context?.company
  const departments = context?.departments || []
  const agents = context?.agents || []

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.6, fontWeight: 600 }}>
          Organization Structure
        </div>
        <h1 style={{ fontSize: 32, margin: '6px 0 8px 0', fontWeight: 700 }}>{company?.name || 'Company Profile'}</h1>
        <p style={{ opacity: 0.7, margin: 0 }}>
          {company?.description || 'Autonomous enterprise operating system with dedicated AI departmental agents.'}
        </p>
      </div>

      {error && (
        <div className="badge badge-error" style={{ padding: '12px 16px', marginBottom: 20, display: 'block', textTransform: 'none' }}>
          {error}
        </div>
      )}

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 13, opacity: 0.7 }}>Organization Identifier</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{company?.slug || 'workspace'}</div>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 13, opacity: 0.7 }}>Operating Timezone</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{company?.timezone || 'UTC'}</div>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 13, opacity: 0.7 }}>Active Departments</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{departments.length}</div>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 13, opacity: 0.7 }}>Autonomous Agents</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{agents.length}</div>
        </div>
      </div>

      {/* Departments Grid */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Company Departments</h2>
          <span style={{ fontSize: 13, opacity: 0.6 }}>{departments.length} configured</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {departments.map((dept: any) => {
            const deptAgents = agents.filter((a: any) => a.departmentId === dept.id || a.slug === dept.name.toLowerCase())

            return (
              <div key={dept.id} className="card" style={{ padding: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{dept.name}</h3>
                  <span className="badge" style={{ textTransform: 'uppercase', fontSize: 11 }}>Active</span>
                </div>

                <p style={{ margin: '0 0 16px 0', fontSize: 14, opacity: 0.75, minHeight: 40, lineHeight: 1.5 }}>
                  {dept.description || 'Core business division responsible for operational workflows.'}
                </p>

                <div style={{ borderTop: 'var(--border-subtle)', paddingTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, opacity: 0.6 }}>Assigned Agent:</span>
                  {deptAgents.length > 0 ? (
                    <Link
                      to={`/agents?agent=${deptAgents[0].slug}`}
                      style={{
                        textDecoration: 'none',
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--color-accent)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      🤖 {deptAgents[0].name} →
                    </Link>
                  ) : (
                    <span style={{ fontSize: 12, opacity: 0.5 }}>None</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Autonomous Agents Overview */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Active Autonomous Agents</h2>
          <Link to="/agents" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 13 }}>
            Open Agent Console →
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
          {agents.map((ag: any) => (
            <div key={ag.id} className="card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  background: 'rgba(99,102,241,0.1)',
                  color: '#6366f1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  fontWeight: 700,
                }}
              >
                🤖
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong style={{ fontSize: 15 }}>{ag.name}</strong>
                  <span style={{ fontSize: 11, opacity: 0.6, textTransform: 'uppercase' }}>{ag.type}</span>
                </div>
                <div style={{ fontSize: 13, opacity: 0.7, marginTop: 2 }}>{ag.description}</div>
              </div>
              <Link
                to={`/agents?agent=${ag.slug}`}
                className="btn"
                style={{ padding: '6px 12px', fontSize: 12 }}
              >
                Chat
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

