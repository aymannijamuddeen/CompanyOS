export default function AdminLayout({ children }: { children: React.ReactNode }) { 
  return <div style={{ display: 'flex' }}><aside style={{ width: 240, borderRight: '1px solid var(--border-subtle)' }}>Admin Nav</aside><main style={{ flex: 1 }}>{children}</main></div> 
}
