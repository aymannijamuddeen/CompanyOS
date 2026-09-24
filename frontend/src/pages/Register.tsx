import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

export default function Register() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      return setError('Password must be at least 8 characters')
    }
    if (password !== confirm) {
      return setError('Passwords do not match')
    }

    setLoading(true)
    try {
      const result = await api.register(username, email, password, companyName)
      if (result.token) {
        useAuthStore.getState().setSession(result.user, result.company, result.token)
        navigate('/')
      } else {
        navigate('/login')
      }
    } catch (e: any) {
      setError(e.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <form
        className="card"
        onSubmit={submit}
        style={{ width: '100%', maxWidth: 460, padding: 40, display: 'grid', gap: 16 }}
      >
        <h1 style={{ fontSize: 'var(--text-2xl, 24px)', fontWeight: 600 }}>Create your company</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Set up your CompanyOS workspace.</p>
        {error && <div className="badge badge-error" style={{ padding: '12px', textTransform: 'none' }}>{error}</div>}
        <input
          className="input"
          placeholder="Company name"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
        />
        <input
          className="input"
          placeholder="Your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          className="input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="input"
          type="password"
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          className="input"
          type="password"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        <button className="btn btn-primary" disabled={loading} type="submit">
          {loading ? 'Creating Company...' : 'Create Company'}
        </button>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--color-accent)' }}>Sign in</Link>
        </span>
      </form>
    </div>
  )
}
