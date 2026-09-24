import { useEffect, useState, useRef } from 'react'
import { api } from '@/lib/api'

interface DocumentItem {
  id: string
  title: string
  content: string
  sourceType: string
  sourceRef?: string
  status: string
  createdAt: string
  updatedAt: string
  _count?: { chunks: number }
  chunks?: Array<{ id: string; chunkIndex: number; content: string }>
}

export default function Knowledge() {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Add/Upload Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [modalTab, setModalTab] = useState<'text' | 'file'>('file')
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newSourceType, setNewSourceType] = useState('handbook')
  const [fileName, setFileName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Inspector Modal
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null)
  const [inspectLoading, setInspectLoading] = useState(false)

  async function loadDocuments() {
    setLoading(true)
    setError('')
    try {
      const data = await api.getDocuments()
      setDocuments(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err.message || 'Failed to load knowledge documents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    const baseName = file.name.replace(/\.[^/.]+$/, '')
    if (!newTitle) setNewTitle(baseName)

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setNewContent(text || '')
      setNewSourceType('file_upload')
    }
    reader.onerror = () => {
      setError('Failed to read file')
    }
    reader.readAsText(file)
  }

  async function handleAddDocument(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim() || !newContent.trim()) {
      setError('Title and content are required')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const created = await api.addDocument({
        title: newTitle.trim(),
        content: newContent.trim(),
        sourceType: newSourceType,
        sourceRef: fileName || undefined,
      })
      setDocuments((prev) => [created, ...prev])
      setIsAddModalOpen(false)
      resetForm()
    } catch (err: any) {
      setError(err.message || 'Failed to save document')
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setNewTitle('')
    setNewContent('')
    setNewSourceType('handbook')
    setFileName('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleDelete(docId: string, title: string) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return
    try {
      await api.deleteDocument(docId)
      setDocuments((prev) => prev.filter((d) => d.id !== docId))
      if (selectedDoc?.id === docId) setSelectedDoc(null)
    } catch (err: any) {
      setError(err.message || 'Failed to delete document')
    }
  }

  async function handleInspect(docId: string) {
    setInspectLoading(true)
    try {
      const doc = await api.getDocument(docId)
      setSelectedDoc(doc)
    } catch (err: any) {
      setError(err.message || 'Failed to inspect document')
    } finally {
      setInspectLoading(false)
    }
  }

  const filteredDocs = documents.filter((doc) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      doc.title.toLowerCase().includes(q) ||
      doc.sourceType.toLowerCase().includes(q) ||
      doc.content.toLowerCase().includes(q)
    )
  })

  const totalChunks = documents.reduce((sum, d) => sum + (d._count?.chunks ?? 0), 0)

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.6, fontWeight: 600 }}>
            Context & Memory
          </div>
          <h1 style={{ fontSize: 32, margin: '6px 0 8px 0', fontWeight: 700 }}>Company Knowledge</h1>
          <p style={{ opacity: 0.7, margin: 0 }}>
            Documents, handbooks, and operational guidelines indexed for CompanyOS semantic retrieval.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm()
            setIsAddModalOpen(true)
          }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600 }}
        >
          <span>＋</span> Add Document / Upload
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div className="card" style={{ padding: 18, borderLeft: '4px solid #6366f1' }}>
          <div style={{ fontSize: 13, opacity: 0.7 }}>Indexed Documents</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{documents.length}</div>
        </div>
        <div className="card" style={{ padding: 18, borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: 13, opacity: 0.7 }}>Knowledge Chunks</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{totalChunks}</div>
        </div>
        <div className="card" style={{ padding: 18, borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: 13, opacity: 0.7 }}>Semantic Search</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>Active</div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="badge badge-error" style={{ padding: '12px 16px', marginBottom: 20, display: 'block', textTransform: 'none', borderRadius: 8 }}>
          {error}
        </div>
      )}

      {/* Search Input */}
      <div className="card" style={{ padding: 14, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <input
          type="text"
          className="input"
          placeholder="Search knowledge documents by title, content, or type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '8px 12px' }}
        />
      </div>

      {/* Documents List */}
      {loading ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', opacity: 0.7 }}>
          Loading company knowledge documents...
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📚</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 18 }}>
            {documents.length === 0 ? 'No knowledge documents yet.' : 'No matching documents found.'}
          </h3>
          <p style={{ opacity: 0.7, margin: '0 0 20px 0', fontSize: 14 }}>
            {documents.length === 0
              ? 'Upload documentation or paste company policies so the intelligence layer can answer accurately.'
              : 'Try searching for different keywords.'}
          </p>
          {documents.length === 0 && (
            <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
              Add First Document
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="card"
              style={{
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 16,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      background: 'rgba(99,102,241,0.2)',
                      color: '#a5b4fc',
                    }}
                  >
                    {doc.sourceType}
                  </span>

                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 600,
                      background: 'rgba(31, 177, 119, 0.2)',
                      color: '#3dd69b',
                    }}
                  >
                    {doc._count?.chunks ?? 0} {doc._count?.chunks === 1 ? 'chunk' : 'chunks'}
                  </span>

                  {doc.sourceRef && (
                    <span style={{ fontSize: 12, opacity: 0.6 }}>
                      📎 {doc.sourceRef}
                    </span>
                  )}

                  <span style={{ fontSize: 12, opacity: 0.5 }}>
                    Updated: {new Date(doc.updatedAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 style={{ margin: '4px 0 8px 0', fontSize: 18, fontWeight: 600 }}>
                  {doc.title}
                </h3>

                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    opacity: 0.75,
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {doc.content}
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  className="btn"
                  style={{ padding: '6px 14px', fontSize: 13 }}
                  onClick={() => handleInspect(doc.id)}
                  disabled={inspectLoading}
                >
                  Inspect Chunks
                </button>

                <button
                  className="btn"
                  style={{
                    padding: '6px 10px',
                    fontSize: 13,
                    color: '#ef4444',
                    background: 'transparent',
                    border: '1px solid rgba(239,68,68,0.2)',
                  }}
                  title="Delete document"
                  onClick={() => handleDelete(doc.id, doc.title)}
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Upload Document Modal */}
      {isAddModalOpen && (
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
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="modal-content"
            style={{
              width: '100%',
              maxWidth: 580,
              padding: 28,
              background: 'var(--surface-raised)',
              border: 'var(--border-subtle)',
              color: 'var(--text-primary)',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Add Knowledge Document</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', opacity: 0.6, color: 'var(--text-primary)' }}
              >
                ✕
              </button>
            </div>

            {/* Tabs: Upload File vs Paste Text */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 18, borderBottom: 'var(--border-subtle)', paddingBottom: 10 }}>
              <button
                type="button"
                className={`btn ${modalTab === 'file' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 16px', fontSize: 13 }}
                onClick={() => setModalTab('file')}
              >
                📁 Upload File
              </button>
              <button
                type="button"
                className={`btn ${modalTab === 'text' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 16px', fontSize: 13 }}
                onClick={() => setModalTab('text')}
              >
                ✍️ Paste Text / Markdown
              </button>
            </div>

            <form onSubmit={handleAddDocument}>
              {modalTab === 'file' && (
                <div style={{ marginBottom: 18 }}>
                  <div
                    style={{
                      border: '2px dashed rgba(255,255,255,0.15)',
                      borderRadius: 12,
                      padding: 24,
                      textAlign: 'center',
                      background: 'var(--surface-base)',
                      cursor: 'pointer',
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {fileName ? `Selected: ${fileName}` : 'Click to select a file'}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
                      Supports .txt, .md, .json, .csv files
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.md,.json,.csv"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Document Title <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Employee Onboarding & Security Guidelines"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px' }}
                  required
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Source Category
                </label>
                <select
                  className="input"
                  value={newSourceType}
                  onChange={(e) => setNewSourceType(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px' }}
                >
                  <option value="handbook">Handbook</option>
                  <option value="policy">Policy</option>
                  <option value="strategy">Strategy</option>
                  <option value="sop">Standard Operating Procedure (SOP)</option>
                  <option value="file_upload">Uploaded File</option>
                  <option value="manual">Manual Entry</option>
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Document Content <span style={{ color: '#ef4444' }}>*</span>
                  {newContent.length > 0 && (
                    <span style={{ fontWeight: 400, opacity: 0.6, marginLeft: 8 }}>
                      ({newContent.length} characters)
                    </span>
                  )}
                </label>
                <textarea
                  className="input"
                  placeholder="Enter the full text or policy content..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  style={{ width: '100%', minHeight: 130, padding: '10px 14px', resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={submitting}
                  style={{ padding: '10px 18px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || !newTitle.trim() || !newContent.trim()}
                  style={{ padding: '10px 24px' }}
                >
                  {submitting ? 'Indexing...' : 'Save & Index Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chunk Inspector Modal */}
      {selectedDoc && (
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
          onClick={() => setSelectedDoc(null)}
        >
          <div
            className="modal-content"
            style={{
              width: '100%',
              maxWidth: 750,
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: 28,
              background: 'var(--surface-raised)',
              border: 'var(--border-subtle)',
              color: 'var(--text-primary)',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    background: 'rgba(99,102,241,0.2)',
                    color: '#a5b4fc',
                  }}
                >
                  {selectedDoc.sourceType}
                </span>
                <h2 style={{ margin: '6px 0 4px 0', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{selectedDoc.title}</h2>
                <div style={{ fontSize: 13, opacity: 0.6 }}>
                  Total Characters: {selectedDoc.content.length} · Chunks: {selectedDoc.chunks?.length ?? selectedDoc._count?.chunks ?? 0}
                </div>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', opacity: 0.6, color: 'var(--text-primary)' }}
              >
                ✕
              </button>
            </div>

            <h4 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.6, margin: '20px 0 10px 0' }}>
              Extracted Semantic Chunks
            </h4>

            {selectedDoc.chunks && selectedDoc.chunks.length > 0 ? (
              <div style={{ display: 'grid', gap: 12 }}>
                {selectedDoc.chunks.map((chk) => (
                  <div
                    key={chk.id}
                    style={{
                      padding: 14,
                      borderRadius: 8,
                      background: 'var(--surface-card)',
                      border: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
                      <span>Chunk #{chk.chunkIndex + 1}</span>
                      <span>{chk.content.length} characters</span>
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
                      {chk.content}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: 14, borderRadius: 8, background: 'var(--surface-card)', border: 'var(--border-subtle)', color: 'var(--text-primary)', fontSize: 14 }}>
                {selectedDoc.content}
              </div>
            )}

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setSelectedDoc(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

