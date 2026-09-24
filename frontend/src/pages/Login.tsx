import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/lib/store'
import { api } from '@/lib/api'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [needs2FA, setNeeds2FA] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await api.login(email, password, twoFactorCode || undefined)
      
      useAuthStore.getState().setSession(result.user, result.company, result.token)
      
      navigate('/')
    } catch (err: any) {
      if (err.message.includes('2FA required')) {
        setNeeds2FA(true)
        setError('Please enter your 2FA code')
      } else {
        setError(err.message || 'Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '48px',
      }}>
        <h1 className="text-display" style={{
          fontSize: 'var(--text-2xl)',
          fontWeight: 600,
          marginBottom: '8px',
          textAlign: 'center',
        }}>
          Welcome back
        </h1>
        <p style={{
          color: 'var(--text-secondary)',
          textAlign: 'center',
          marginBottom: '32px',
        }}>
          Sign in to your account
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && (
            <div className="badge badge-error" style={{ padding: '12px', textTransform: 'none' }}>
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" style={{
              display: 'block',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              marginBottom: '8px',
            }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={needs2FA}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label htmlFor="password" style={{
              display: 'block',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              marginBottom: '8px',
            }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={needs2FA}
              style={{ width: '100%' }}
            />
          </div>

          {needs2FA && (
            <div>
              <label htmlFor="2fa" style={{
                display: 'block',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                marginBottom: '8px',
              }}>
                2FA Code
              </label>
              <input
                id="2fa"
                type="text"
                className="input"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                required
                maxLength={6}
                placeholder="000000"
                style={{ width: '100%', letterSpacing: '0.5em', textAlign: 'center' }}
                autoFocus
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '8px' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
