import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './lib/store'
import Header from './components/Header'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Agents from './pages/Agents'
import Tasks from './pages/Tasks'
import Knowledge from './pages/Knowledge'
import Company from './pages/Company'
import Settings from './pages/Settings'

function Protected({ children }: { children: React.ReactNode }) {
  return useAuthStore((s) => s.isAuthenticated) ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/*"
        element={
          <Protected>
            <Header />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/knowledge" element={<Knowledge />} />
              <Route path="/company" element={<Company />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Protected>
        }
      />
    </Routes>
  )
}

