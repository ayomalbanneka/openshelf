'use client'
import { useEffect, useState } from 'react'
import { http } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import { FolderOpen, Plus, RefreshCw, Search, Trash2, CornerDownRight } from 'lucide-react'

interface Category {
  id: string; name: string; slug: string; description?: string
  _count: { resources: number }
  children: { id: string; name: string; slug: string; _count: { resources: number } }[]
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading]       = useState(true)
  const [newName, setNewName]       = useState('')
  const [newDesc, setNewDesc]       = useState('')
  const [newParent, setNewParent]   = useState('')
  const [creating, setCreating]     = useState(false)
  const [acting, setActing]         = useState<string | null>(null)
  const [error, setError]           = useState('')
  const [filter, setFilter]         = useState('')

  const fetch_ = () => {
    setLoading(true)
    setError('')
    http.get('/admin/categories')
      .then((r) => setCategories(r.data))
      .catch((err) => setError(getErrorMessage(err, 'Failed to load categories')))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetch_() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) { setError('Name is required'); return }
    setCreating(true); setError('')
    try {
      await http.post('/admin/categories', { name: newName, description: newDesc, parentId: newParent || undefined })
      setNewName(''); setNewDesc(''); setNewParent('')
      fetch_()
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to create category'))
    } finally { setCreating(false) }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return
    setActing(id)
    try {
      await http.delete(`/admin/categories/${id}`)
      fetch_()
    } finally { setActing(null) }
  }

  const inputStyle = { border: '1px solid var(--admin-border)', backgroundColor: 'var(--admin-surface)', color: 'var(--admin-text)' }

  const filtered = categories
    .map((cat) => {
      const term = filter.trim().toLowerCase()
      if (!term) return cat
      const parentMatch = [cat.name, cat.description, cat.slug].some((v) => String(v || '').toLowerCase().includes(term))
      const childMatches = cat.children.filter((child) =>
        [child.name, child.slug].some((v) => String(v || '').toLowerCase().includes(term))
      )
      if (parentMatch || childMatches.length > 0) {
        return { ...cat, children: childMatches }
      }
      return null
    })
    .filter(Boolean) as Category[]

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--admin-text)' }}>Categories</h1>
        <p className="text-sm" style={{ color: 'var(--admin-muted)' }}>Manage resource categories and subcategories.</p>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <label className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--admin-muted)' }} />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter categories..."
            className="h-9 rounded-xl pl-9 pr-3 text-sm outline-none w-full"
            style={inputStyle}
          />
        </label>
        <button
          onClick={fetch_}
          className="text-xs px-3 py-1.5 rounded-xl font-semibold inline-flex items-center gap-2"
          style={{ backgroundColor: 'var(--admin-soft)', color: 'var(--admin-text)', border: '1px solid var(--admin-border)' }}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* Create form */}
      <form onSubmit={handleCreate} className="rounded-2xl p-5 flex flex-col gap-4"
        style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', boxShadow: 'var(--admin-card-shadow)' }}>
        <p className="text-sm font-bold inline-flex items-center gap-2" style={{ color: 'var(--admin-text)' }}>
          <Plus className="h-4 w-4" />
          Create new category
        </p>
        <div className="grid sm:grid-cols-3 gap-3">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Category name *"
            className="h-10 rounded-xl px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" style={inputStyle} />
          <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description (optional)"
            className="h-10 rounded-xl px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" style={inputStyle} />
          <select value={newParent} onChange={(e) => setNewParent(e.target.value)}
            className="h-10 rounded-xl px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" style={inputStyle}>
            <option value="">Top-level category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex justify-end">
          <button type="submit" disabled={creating}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50 inline-flex items-center gap-2"
            style={{ backgroundColor: 'var(--admin-accent-strong)' }}>
            <Plus className="h-4 w-4" />
            {creating ? 'Creating...' : 'Create category'}
          </button>
        </div>
      </form>

      {/* Category list */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3].map((i) => <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--admin-soft)' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-sm rounded-2xl" style={{ border: '2px dashed var(--admin-border)', color: 'var(--admin-muted)' }}>
          No categories match your filter.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((cat) => (
            <div key={cat.id} className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', boxShadow: 'var(--admin-card-shadow)' }}>
              {/* Parent category */}
              <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: cat.children.length > 0 ? '1px solid var(--admin-border)' : 'none' }}>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center text-sm"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--admin-accent) 14%, transparent)', color: 'var(--admin-accent)' }}>
                    <FolderOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--admin-text)' }}>{cat.name}</p>
                    {cat.description && <p className="text-xs" style={{ color: 'var(--admin-muted)' }}>{cat.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: 'var(--admin-muted)' }}>{cat._count.resources} resources</span>
                  <button onClick={() => handleDelete(cat.id, cat.name)} disabled={acting === cat.id}
                    className="text-xs px-2.5 py-1 rounded-lg font-medium inline-flex items-center gap-1.5 disabled:opacity-50"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--admin-danger) 14%, transparent)', color: 'var(--admin-danger)' }}>
                    <Trash2 className="h-3.5 w-3.5" />
                    {acting === cat.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>

              {/* Sub-categories */}
              {cat.children.map((child) => (
                <div key={child.id} className="flex items-center justify-between px-5 py-2.5 pl-12"
                  style={{ borderTop: '1px solid var(--admin-border)', backgroundColor: 'var(--admin-soft)' }}>
                  <p className="text-sm inline-flex items-center gap-1.5" style={{ color: 'var(--admin-muted)' }}><CornerDownRight className="h-3.5 w-3.5" />{child.name}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: 'var(--admin-muted)' }}>{child._count.resources} resources</span>
                    <button onClick={() => handleDelete(child.id, child.name)} disabled={acting === child.id}
                      className="text-xs px-2.5 py-1 rounded-lg font-medium inline-flex items-center gap-1.5 disabled:opacity-50"
                      style={{ backgroundColor: 'color-mix(in srgb, var(--admin-danger) 14%, transparent)', color: 'var(--admin-danger)' }}>
                      <Trash2 className="h-3.5 w-3.5" />
                      {acting === child.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}