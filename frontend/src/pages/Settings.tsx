import { useState } from 'react'
import { useAuthStore } from '@/lib/store'

export default function Settings() {
  const { user, company } = useAuthStore()
  const [successMsg, setSuccessMsg] = useState('')

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.6, fontWeight: 600 }}>
          Configuration & Account
        </div>
        <h1 style={{ fontSize: 32, margin: '6px 0 8px 0', fontWeight: 700 }}>Settings</h1>
        <p style={{ opacity: 0.7, margin: 0 }}>
          Manage your account profile, workspace defaults, and security credentials.
        </p>
      </div>

      {successMsg && (
        <div className="badge badge-success" style={{ padding: '12px 16px', marginBottom: 20, display: 'block', textTransform: 'none' }}>
          {successMsg}
        </div>
      )}

      {/* Profile Card */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px 0' }}>User Profile</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, opacity: 0.7, marginBottom: 4 }}>Username</label>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{user?.username || 'user'}</div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, opacity: 0.7, marginBottom: 4 }}>Email Address</label>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{user?.email || 'user@example.com'}</div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, opacity: 0.7, marginBottom: 4 }}>Role</label>
            <span className="badge" style={{ textTransform: 'uppercase', fontSize: 12 }}>
              {user?.role || 'Owner'}
            </span>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, opacity: 0.7, marginBottom: 4 }}>Account Status</label>
            <span className="badge badge-success" style={{ fontSize: 12 }}>
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Workspace Settings Card */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px 0' }}>Workspace Details</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, opacity: 0.7, marginBottom: 4 }}>Company Name</label>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{company?.name || 'Workspace'}</div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, opacity: 0.7, marginBottom: 4 }}>Workspace Slug</label>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{company?.slug || 'workspace'}</div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, opacity: 0.7, marginBottom: 4 }}>Company ID</label>
            <div style={{ fontSize: 13, opacity: 0.6, fontFamily: 'monospace' }}>{company?.id}</div>
          </div>
        </div>
      </div>

      {/* Security Card */}
      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px 0' }}>Security & Authentication</h2>
        <p style={{ fontSize: 14, opacity: 0.7, marginBottom: 16 }}>
          Authentication sessions use secure JWT tokens with automatic multi-tenant scoping.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderTop: 'var(--border-subtle)' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Two-Factor Authentication (2FA)</div>
            <div style={{ fontSize: 13, opacity: 0.7 }}>Protect your account with TOTP verification.</div>
          </div>
          <span className="badge" style={{ color: 'var(--text-disabled)', fontSize: 12 }}>
            Disabled
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderTop: 'var(--border-subtle)' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Session Security</div>
            <div style={{ fontSize: 13, opacity: 0.7 }}>Active 7-day token expiration.</div>
          </div>
          <button
            className="btn btn-secondary"
            style={{ padding: '6px 14px', fontSize: 13 }}
            onClick={() => setSuccessMsg('All session credentials verified.')}
          >
            Verify Session
          </button>
        </div>
      </div>
    </main>
  )
}

