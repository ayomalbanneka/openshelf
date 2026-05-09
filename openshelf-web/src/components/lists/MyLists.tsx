'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import Link from 'next/link'
import { LibraryBig, List } from 'lucide-react'
import { toast } from '@/lib/toast'

interface ReadingList {
  id: string
  title: string
  description?: string
  isPublic: boolean
  createdAt: string
  _count: { items: number }
}

export function MyLists() {
  const [lists, setLists]           = useState<ReadingList[]>([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [title, setTitle]           = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic]     = useState(true)
  const [creating, setCreating]     = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    api.lists.getMine()
      .then(setLists)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required'); return }
    setCreating(true); setError('')
    try {
      const newList = await api.lists.create({ title, description, isPublic })
      setLists((prev) => [newList, ...prev])
      setTitle(''); setDescription(''); setIsPublic(true); setShowForm(false)
    } catch {
      toast.error('Failed to create list')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this list?')) return
    try {
      await api.lists.remove(id)
      setLists((prev) => prev.filter((l) => l.id !== id))
      toast.success('List deleted')
    } catch {
      toast.error('Failed to delete list')
    }
  }

  const inputStyle = {
    border: '1px solid hsl(var(--border))',
    backgroundColor: 'hsl(var(--background))',
    color: 'hsl(var(--foreground))',
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {loading ? '' : `${lists.length} ${lists.length === 1 ? 'list' : 'lists'}`}
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
          </svg>
          New list
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="flex flex-col gap-4 p-5 rounded-2xl"
          style={{
            border: '1px solid hsl(var(--border))',
            backgroundColor: 'hsl(var(--background))',
          }}
        >
          <h2 className="font-semibold">Create a new list</h2>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Books to read in 2025"
              className="h-10 rounded-xl px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              style={inputStyle}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description…"
              rows={2}
              className="rounded-xl px-3 py-2 text-sm outline-none resize-none focus:ring-2 focus:ring-blue-500"
              style={inputStyle}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-sm select-none">
            <div
              className="relative w-9 h-5 rounded-full transition-colors"
              style={{ backgroundColor: isPublic ? '#2563eb' : 'hsl(var(--muted))' }}
              onClick={() => setIsPublic(!isPublic)}
            >
              <div
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm"
                style={{ transform: isPublic ? 'translateX(18px)' : 'translateX(2px)' }}
              />
            </div>
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="hidden" />
            Make this list public
          </label>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-sm transition-colors"
              style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {creating ? 'Creating…' : 'Create list'}
            </button>
          </div>
        </form>
      )}

      {/* Lists */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse" style={{ backgroundColor: 'hsl(var(--muted))' }} />
          ))}
        </div>
      ) : lists.length === 0 ? (
        <div
          className="text-center py-20 rounded-2xl"
          style={{ border: '2px dashed hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
        >
          <LibraryBig className="w-10 h-10 mb-3" />
          <p className="font-medium mb-1">No lists yet</p>
          <p className="text-sm">Create your first reading list above.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {lists.map((list) => (
            <div
              key={list.id}
              className="group flex items-center gap-4 p-4 rounded-xl transition-all hover:-translate-y-0.5"
              style={{
                border: '1px solid hsl(var(--border))',
                backgroundColor: 'hsl(var(--background))',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              {/* Icon */}
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                style={{ backgroundColor: 'hsl(var(--muted))' }}
              >
                <List className="w-5 h-5" style={{ color: 'hsl(var(--muted-foreground))' }} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/lists/${list.id}`}
                    className="font-medium text-sm hover:text-blue-600 transition-colors truncate"
                  >
                    {list.title}
                  </Link>
                  {!list.isPublic && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0"
                      style={{
                        backgroundColor: 'hsl(var(--muted))',
                        color: 'hsl(var(--muted-foreground))',
                      }}
                    >
                      Private
                    </span>
                  )}
                </div>
                {list.description && (
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {list.description}
                  </p>
                )}
                <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {list._count.items} {list._count.items === 1 ? 'item' : 'items'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Link
                  href={`/lists/${list.id}`}
                  className="p-2 rounded-lg text-xs font-medium transition-colors"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
                <button
                  onClick={() => handleDelete(list.id)}
                  className="p-2 rounded-lg transition-colors hover:bg-red-50 hover:text-red-500"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                  title="Delete list"
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}