import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../lib/store'
import { api } from '../lib/api'

export default function Header() {
  const { user, company, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await api.logout()
    } catch {
      // Ignore network errors on logout
    }
    logout()
    navigate('/login')
  }

  return (
    <header
      style={{
        padding: '0 28px',
        height: 'var(--header-height)',
        borderBottom: 'var(--border-subtle)',
        backgroundColor: 'var(--surface-card)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Link to="/" style={{ fontWeight: 700, fontSize: 20, textDecoration: 'none', color: 'var(--text-primary)' }}>
        CompanyOS
      </Link>
      {user && (
        <nav style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Overview
          </NavLink>
          <NavLink to="/agents" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Agents
          </NavLink>
          <NavLink to="/tasks" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Tasks
          </NavLink>
          <NavLink to="/knowledge" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Knowledge
          </NavLink>
          <NavLink to="/company" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Company
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Settings
          </NavLink>
          <span
            style={{
              fontSize: 'var(--text-xs)',
              padding: '6px 12px',
              background: 'var(--surface-raised)',
              border: 'var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              marginLeft: 8,
              marginRight: 8,
            }}
          >
            {company?.name || 'Workspace'}
          </span>
          <button className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: 'var(--text-xs)' }} onClick={handleLogout}>
            Sign out
          </button>
        </nav>
      )}
    </header>
  )
}
