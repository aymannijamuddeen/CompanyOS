import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'done' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  agentId?: string
  dueAt?: string
  createdAt: string
  updatedAt: string
  agent?: { id: string; name: string; slug: string; type: string }
  assignedTo?: { id: string; username: string; email: string }
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Create modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newPriority, setNewPriority] = useState('medium')
  const [newAgentId, setNewAgentId] = useState('')
  const [newDueAt, setNewDueAt] = useState('')
  const [creating, setCreating] = useState(false)

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [fetchedTasks, fetchedAgents] = await Promise.all([
        api.getTasks(),
        api.getAgents().catch(() => []),
      ])
      setTasks(Array.isArray(fetchedTasks) ? fetchedTasks : [])
      setAgents(Array.isArray(fetchedAgents) ? fetchedAgents : [])
    } catch (err: any) {
      setError(err.message || 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return

    setCreating(true)
    setError('')
    try {
      const created = await api.createTask({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        priority: newPriority,
        agentId: newAgentId || undefined,
        dueAt: newDueAt || undefined,
        status: 'todo',
      })
      setTasks((prev) => [created, ...prev])
      setIsModalOpen(false)
      setNewTitle('')
      setNewDescription('')
      setNewPriority('medium')
      setNewAgentId('')
      setNewDueAt('')
    } catch (err: any) {
      setError(err.message || 'Failed to create task')
    } finally {
      setCreating(false)
    }
  }

  async function handleStatusChange(taskId: string, newStatus: Task['status']) {
    try {
      const updated = await api.updateTask(taskId, { status: newStatus })
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updated, status: newStatus } : t)))
    } catch (err: any) {
      setError(err.message || 'Failed to update task status')
    }
  }

  async function handleDeleteTask(taskId: string, title: string) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return
    try {
      await api.deleteTask(taskId)
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
    } catch (err: any) {
      setError(err.message || 'Failed to delete task')
    }
  }

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchTitle = task.title.toLowerCase().includes(q)
      const matchDesc = task.description?.toLowerCase().includes(q)
      const matchAgent = task.agent?.name.toLowerCase().includes(q)
      if (!matchTitle && !matchDesc && !matchAgent) return false
    }
    return true
  })

  const todoCount = tasks.filter((t) => t.status === 'todo').length
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length
  const doneCount = tasks.filter((t) => t.status === 'done').length

  const priorityColors: Record<string, { bg: string; text: string }> = {
    urgent: { bg: 'rgba(229, 72, 77, 0.2)', text: '#ff8589' },
    high: { bg: 'rgba(232, 163, 61, 0.2)', text: '#f5c070' },
    medium: { bg: 'rgba(59, 130, 196, 0.2)', text: '#7cb5ec' },
    low: { bg: 'rgba(255, 255, 255, 0.08)', text: '#9AA1AC' },
  }

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.6, fontWeight: 600 }}>
            Operational Execution
          </div>
          <h1 style={{ fontSize: 32, margin: '6px 0 8px 0', fontWeight: 700 }}>Company Tasks</h1>
          <p style={{ opacity: 0.7, margin: 0 }}>
            Track, assign, and coordinate business initiatives across autonomous agents and human team members.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setIsModalOpen(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600 }}
        >
          <span>＋</span> Create Task
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div className="card" style={{ padding: 18, borderLeft: '4px solid #6366f1' }}>
          <div style={{ fontSize: 13, opacity: 0.7 }}>Total Tasks</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{tasks.length}</div>
        </div>
        <div className="card" style={{ padding: 18, borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: 13, opacity: 0.7 }}>To Do</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{todoCount}</div>
        </div>
        <div className="card" style={{ padding: 18, borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: 13, opacity: 0.7 }}>In Progress</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{inProgressCount}</div>
        </div>
        <div className="card" style={{ padding: 18, borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: 13, opacity: 0.7 }}>Completed</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{doneCount}</div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="badge badge-error" style={{ padding: '12px 16px', marginBottom: 20, display: 'block', textTransform: 'none', borderRadius: 8 }}>
          {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: 16, marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          className="input"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '8px 12px' }}
        />

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 13, opacity: 0.7 }}>Status:</span>
          {(['all', 'todo', 'in_progress', 'done'] as const).map((s) => (
            <button
              key={s}
              className={`btn ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                padding: '6px 14px',
                fontSize: 12,
                borderRadius: 16,
              }}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'All' : s === 'in_progress' ? 'In Progress' : s.toUpperCase()}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 13, opacity: 0.7 }}>Priority:</span>
          <select
            className="input"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{ padding: '6px 10px', fontSize: 13 }}
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', opacity: 0.7 }}>
          Loading company tasks...
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 18 }}>
            {tasks.length === 0 ? 'No tasks yet.' : 'No matching tasks found.'}
          </h3>
          <p style={{ opacity: 0.7, margin: '0 0 20px 0', fontSize: 14 }}>
            {tasks.length === 0
              ? 'Get started by creating your first task to coordinate work with your agents.'
              : 'Try adjusting your search query or status filter.'}
          </p>
          {tasks.length === 0 && (
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              Create First Task
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {filteredTasks.map((task) => {
            const pColor = priorityColors[task.priority] || priorityColors.medium
            const isDone = task.status === 'done'

            return (
              <div
                key={task.id}
                className="card"
                style={{
                  padding: '20px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 16,
                  opacity: isDone ? 0.75 : 1,
                  background: isDone ? 'rgba(255, 255, 255, 0.02)' : 'var(--surface-card)',
                  transition: 'all 0.15s ease',
                  border: 'var(--border-subtle)',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: pColor.bg,
                        color: pColor.text,
                      }}
                    >
                      {task.priority}
                    </span>

                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        background:
                          task.status === 'done'
                            ? 'rgba(31, 177, 119, 0.2)'
                            : task.status === 'in_progress'
                            ? 'rgba(59, 130, 196, 0.2)'
                            : 'rgba(255, 255, 255, 0.08)',
                        color:
                          task.status === 'done'
                            ? '#3dd69b'
                            : task.status === 'in_progress'
                            ? '#7cb5ec'
                            : 'var(--text-secondary)',
                      }}
                    >
                      {task.status.replace('_', ' ')}
                    </span>

                    {task.agent && (
                      <span
                        style={{
                          fontSize: 12,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '2px 8px',
                          borderRadius: 12,
                          background: 'rgba(232, 163, 61, 0.15)',
                          color: '#E8A33D',
                          fontWeight: 500,
                        }}
                      >
                        🤖 {task.agent.name}
                      </span>
                    )}

                    {task.dueAt && (
                      <span style={{ fontSize: 12, opacity: 0.6 }}>
                        📅 Due: {new Date(task.dueAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <h3
                    style={{
                      margin: '4px 0 6px 0',
                      fontSize: 17,
                      fontWeight: 600,
                      textDecoration: isDone ? 'line-through' : 'none',
                    }}
                  >
                    {task.title}
                  </h3>

                  {task.description && (
                    <p style={{ margin: 0, fontSize: 14, opacity: 0.75, lineHeight: 1.5 }}>
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Status Switcher & Delete Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {task.status !== 'in_progress' && task.status !== 'done' && (
                    <button
                      className="btn"
                      style={{ padding: '6px 12px', fontSize: 12 }}
                      title="Move to In Progress"
                      onClick={() => handleStatusChange(task.id, 'in_progress')}
                    >
                      Start
                    </button>
                  )}

                  {task.status !== 'done' && (
                    <button
                      className="btn btn-primary"
                      style={{ padding: '6px 12px', fontSize: 12 }}
                      title="Mark as Completed"
                      onClick={() => handleStatusChange(task.id, 'done')}
                    >
                      ✓ Complete
                    </button>
                  )}

                  {task.status === 'done' && (
                    <button
                      className="btn"
                      style={{ padding: '6px 12px', fontSize: 12 }}
                      title="Reopen task"
                      onClick={() => handleStatusChange(task.id, 'todo')}
                    >
                      ↺ Reopen
                    </button>
                  )}

                  <button
                    className="btn"
                    style={{
                      padding: '6px 10px',
                      fontSize: 13,
                      color: '#ef4444',
                      background: 'transparent',
                      border: '1px solid rgba(239,68,68,0.2)',
                    }}
                    title="Delete task"
                    onClick={() => handleDeleteTask(task.id, task.title)}
                  >
                    🗑
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Task Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 1000,
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="modal-content"
            style={{
              width: '100%',
              maxWidth: 540,
              padding: 28,
              background: 'var(--surface-raised)',
              border: 'var(--border-subtle)',
              color: 'var(--text-primary)',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Create New Task</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', opacity: 0.6, color: 'var(--text-primary)' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Task Title <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Audit Q3 marketing spend and ROI"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px' }}
                  required
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Description (Optional)
                </label>
                <textarea
                  className="input"
                  placeholder="Provide context, deliverables, and acceptance criteria..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  style={{ width: '100%', minHeight: 90, padding: '10px 14px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                    Priority
                  </label>
                  <select
                    className="input"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px' }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                    Assign Autonomous Agent
                  </label>
                  <select
                    className="input"
                    value={newAgentId}
                    onChange={(e) => setNewAgentId(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px' }}
                  >
                    <option value="">None (Unassigned)</option>
                    {agents.map((ag) => (
                      <option key={ag.id} value={ag.id}>
                        {ag.name} ({ag.slug})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  className="input"
                  value={newDueAt}
                  onChange={(e) => setNewDueAt(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setIsModalOpen(false)}
                  disabled={creating}
                  style={{ padding: '10px 18px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creating || !newTitle.trim()}
                  style={{ padding: '10px 24px' }}
                >
                  {creating ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

