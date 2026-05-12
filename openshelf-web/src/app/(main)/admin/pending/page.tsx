'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { http } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import { toast } from '@/lib/toast'

interface PendingResource {
  id: string; title: string; slug: string; type: string; createdAt: string
  uploadedBy: { id: string; name: string; email: string }
  category: { id: string; name: string }
  _count: { reviews: number }
}

interface PendingResponse {
  data: PendingResource[]
  meta: { total: number; page: number; limit: number; pages: number }
}

const TYPES = ['BOOK', 'COURSE', 'EXAM_PAPER', 'DOCUMENT', 'AUDIO']

export default function PendingPage() {
  const [resources, setResources] = useState<PendingResource[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const limit = 15

  const fetch_ = async (q = search, p = page) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(limit) })
      if (q) params.set('search', q)
      const { data } = await http.get<PendingResponse>(`/admin/pending?${params}`)
      setResources(data.data)
      setTotal(data.meta.total)
      setPage(data.meta.page)
      setPages(data.meta.pages)
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to load pending resources'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch_(search, page) }, [page])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    const shouldFetchNow = page === 1
    setSearch(q)
    setPage(1)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      if (shouldFetchNow) fetch_(q, 1)
    }, 350)
  }

  const handlePublish = async (id: string, title: string) => {
    if (!confirm(`Publish "${title}"?`)) return
    setActing(id)
    try {
      await http.patch(`/admin/resources/${id}/publish`)
      setResources((prev) => prev.filter((r) => r.id !== id))
      setTotal((t) => t - 1)
      toast.success('Resource published!')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to publish resource'))
    } finally {
      setActing(null)
    }
  }

  const handleReject = async (id: string, title: string) => {
    if (!confirm(`Reject and delete "${title}"? This cannot be undone.`)) return
    setActing(id)
    try {
      await http.delete(`/admin/resources/${id}`)
      setResources((prev) => prev.filter((r) => r.id !== id))
      setTotal((t) => t - 1)
      toast.success('Resource rejected and deleted')
    } catch {
      toast.error('Failed to reject resource')
    } finally {
      setActing(null)
    }
  }

  const row = 'grid grid-cols-12 gap-3 px-4 py-3 items-center text-sm'
  const inputStyle = { border: '1px solid var(--admin-border)', backgroundColor: 'var(--admin-surface)', color: 'var(--admin-text)' }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--admin-text)' }}>Pending review</h1>
          <p className="text-sm" style={{ color: 'var(--admin-muted)' }}>{total} awaiting review</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={handleSearch}
            placeholder="Search title, uploader, or category"
            className="h-9 rounded-xl px-3 text-sm outline-none w-64"
            style={inputStyle}
          />
          <button
            onClick={() => fetch_(search, page)}
            className="text-xs px-3 py-1.5 rounded-xl font-semibold"
            style={{ backgroundColor: 'var(--admin-soft)', color: 'var(--admin-text)' }}
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 text-sm rounded-xl px-4 py-3"
          style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
          <span>{error}</span>
          <button
            onClick={() => fetch_(search, page)}
            className="text-xs px-3 py-1.5 rounded-xl font-semibold"
            style={{ backgroundColor: '#fecaca', color: '#7f1d1d' }}
          >
            Retry
          </button>
        </div>
      )}

      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', boxShadow: 'var(--admin-card-shadow)' }}>
        <div className={`${row} text-xs font-bold uppercase tracking-wider`}
          style={{ backgroundColor: 'var(--admin-soft)', color: 'var(--admin-muted)', borderBottom: '1px solid var(--admin-border)' }}>
          <div className="col-span-4">Resource</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-3">Uploader</div>
          <div className="col-span-1 text-center">Reviews</div>
          <div className="col-span-2 text-center">Actions</div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-0">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 mx-4 my-2 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--admin-soft)' }} />
            ))}
          </div>
        ) : resources.length === 0 ? (
          <div className="py-16 text-center text-sm" style={{ color: 'var(--admin-muted)' }}>
            No pending resources.
          </div>
        ) : (
          resources.map((r, i) => (
            <div key={r.id} className={row} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--admin-border)' }}>
              <div className="col-span-4 min-w-0">
                <Link
                  href={`/resources/${r.slug}`}
                  target="_blank"
                  className="text-sm font-medium truncate block hover:text-blue-600 transition-colors"
                  style={{ color: 'var(--admin-text)' }}
                >
                  {r.title}
                </Link>
                <p className="text-xs truncate" style={{ color: 'var(--admin-muted)' }}>
                  {r.category.name} · {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: '#fff7ed', color: '#9a3412' }}>
                  {TYPES.includes(r.type) ? r.type.replace('_', ' ') : r.type}
                </span>
              </div>
              <div className="col-span-3 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--admin-text)' }}>{r.uploadedBy.name}</p>
                <p className="text-xs truncate" style={{ color: 'var(--admin-muted)' }}>{r.uploadedBy.email}</p>
              </div>
              <div className="col-span-1 text-center text-sm" style={{ color: 'var(--admin-muted)' }}>{r._count.reviews}</div>
              <div className="col-span-2 flex items-center justify-center gap-2">
                <button
                  onClick={() => handlePublish(r.id, r.title)}
                  disabled={acting === r.id}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#dcfce7', color: '#166534' }}
                >
                  {acting === r.id ? '...' : 'Publish'}
                </button>
                <button
                  onClick={() => handleReject(r.id, r.title)}
                  disabled={acting === r.id}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}
                >
                  {acting === r.id ? '...' : 'Reject'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="text-xs px-3 py-1.5 rounded-xl font-semibold disabled:opacity-50"
            style={{ backgroundColor: 'var(--admin-soft)', color: 'var(--admin-text)' }}
          >
            Prev
          </button>
          <span className="text-xs" style={{ color: 'var(--admin-muted)' }}>Page {page} of {pages}</span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages || loading}
            className="text-xs px-3 py-1.5 rounded-xl font-semibold disabled:opacity-50"
            style={{ backgroundColor: 'var(--admin-soft)', color: 'var(--admin-text)' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}