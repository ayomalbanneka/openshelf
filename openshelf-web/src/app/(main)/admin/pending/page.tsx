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
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'publish' | 'reject'>('publish')
  const [modalResource, setModalResource] = useState<PendingResource | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkReason, setBulkReason] = useState('')
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [bulkMode, setBulkMode] = useState<'publish' | 'reject'>('publish')
  const [bulking, setBulking] = useState(false)
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

  const openPublishModal = (resource: PendingResource) => {
    setModalMode('publish')
    setModalResource(resource)
    setRejectReason('')
    setModalOpen(true)
  }

  const openRejectModal = (resource: PendingResource) => {
    setModalMode('reject')
    setModalResource(resource)
    setRejectReason('')
    setModalOpen(true)
  }

  const closeModal = () => {
    if (acting) return
    setModalOpen(false)
  }

  const handleModalConfirm = async () => {
    if (!modalResource) return
    setActing(modalResource.id)

    try {
      if (modalMode === 'publish') {
        await http.patch(`/admin/resources/${modalResource.id}/publish`)
        setResources((prev) => prev.filter((r) => r.id !== modalResource.id))
        setTotal((t) => t - 1)
        toast.success('Resource published!')
        setModalOpen(false)
        return
      }

      await http.delete(`/admin/resources/${modalResource.id}/reject`, {
        data: { reason: rejectReason.trim() || null },
      })
      setResources((prev) => prev.filter((r) => r.id !== modalResource.id))
      setTotal((t) => t - 1)
      toast.success('Resource rejected and deleted')
      setModalOpen(false)
    } catch (err: unknown) {
      const message = modalMode === 'publish'
        ? 'Failed to publish resource'
        : 'Failed to reject resource'
      toast.error(getErrorMessage(err, message))
    } finally {
      setActing(null)
    }
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === resources.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(resources.map((r) => r.id)))
    }
  }

  const handleBulkAction = async () => {
    if (selected.size === 0) return
    setBulking(true)
    try {
      const ids = Array.from(selected)
      const endpoint = bulkMode === 'publish'
        ? '/admin/resources/bulk-publish'
        : '/admin/resources/bulk-reject'

      const body = bulkMode === 'publish'
        ? { ids }
        : { ids, reason: bulkReason }

      const { data } = await http.post(endpoint, body)
      toast.success(data.message)
      setSelected(new Set())
      setBulkModalOpen(false)
      setBulkReason('')
      fetch_(search, page)
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Bulk action failed'))
    } finally {
      setBulking(false)
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

      {/* Bulk action bar — appears when items are selected */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
          style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <span className="text-sm font-medium" style={{ color: '#1e40af' }}>
            {selected.size} selected
          </span>
          <div className="flex-1" />
          <button
            onClick={() => { setBulkMode('publish'); setBulkModalOpen(true) }}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold"
            style={{ backgroundColor: '#dcfce7', color: '#166534' }}
          >
            Publish all
          </button>
          <button
            onClick={() => { setBulkMode('reject'); setBulkModalOpen(true) }}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold"
            style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}
          >
            Reject all
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs px-3 py-1.5 rounded-lg font-medium"
            style={{ backgroundColor: 'var(--admin-soft)', color: 'var(--admin-muted)' }}
          >
            Clear
          </button>
        </div>
      )}

      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', boxShadow: 'var(--admin-card-shadow)' }}>
        <div className={`${row} text-xs font-bold uppercase tracking-wider`}
          style={{ backgroundColor: 'var(--admin-soft)', color: 'var(--admin-muted)', borderBottom: '1px solid var(--admin-border)' }}>
          <div className="col-span-1 flex items-center">
            <input
              type="checkbox"
              checked={selected.size === resources.length && resources.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 accent-blue-600 cursor-pointer"
            />
          </div>
          <div className="col-span-4">Resource</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Uploader</div>
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
              <div className="col-span-1 flex items-center">
                <input
                  type="checkbox"
                  checked={selected.has(r.id)}
                  onChange={() => toggleSelect(r.id)}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
              </div>
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
              <div className="col-span-2 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--admin-text)' }}>{r.uploadedBy.name}</p>
                <p className="text-xs truncate" style={{ color: 'var(--admin-muted)' }}>{r.uploadedBy.email}</p>
              </div>
              <div className="col-span-1 text-center text-sm" style={{ color: 'var(--admin-muted)' }}>{r._count.reviews}</div>
              <div className="col-span-2 flex items-center justify-center gap-2">
                <button
                  onClick={() => openPublishModal(r)}
                  disabled={acting === r.id}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#dcfce7', color: '#166534' }}
                >
                  {acting === r.id ? '...' : 'Publish'}
                </button>
                <button
                  onClick={() => openRejectModal(r)}
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

      {modalOpen && modalResource && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div
            className="w-full max-w-lg rounded-2xl overflow-hidden modal-panel"
            style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', boxShadow: 'var(--admin-shadow)' }}
          >
            <div
              className="px-6 py-5"
              style={{
                background: modalMode === 'publish'
                  ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.05))'
                  : 'linear-gradient(135deg, rgba(248, 113, 113, 0.16), rgba(251, 191, 36, 0.06))',
                borderBottom: '1px solid var(--admin-border)',
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0"
                    style={{
                      background: modalMode === 'publish'
                        ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(16, 185, 129, 0.75))'
                        : 'linear-gradient(135deg, rgba(248, 113, 113, 0.9), rgba(244, 63, 94, 0.75))',
                      boxShadow: '0 12px 24px rgba(15, 23, 42, 0.12)',
                    }}
                  >
                    {modalMode === 'publish' ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M20 6L9 17l-5-5" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M6 6l12 12M18 6l-12 12" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--admin-muted)' }}>
                      {modalMode === 'publish' ? 'Approve submission' : 'Reject submission'}
                    </p>
                    <h2 className="text-lg font-bold" style={{ color: 'var(--admin-text)' }}>
                      {modalMode === 'publish' ? 'Publish this resource?' : 'Reject and delete this resource?'}
                    </h2>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="text-sm px-2 py-1 rounded-lg"
                  style={{ color: 'var(--admin-muted)' }}
                >
                  ✕
                </button>
              </div>
              <p className="mt-2 text-sm" style={{ color: 'var(--admin-muted)' }}>
                {modalMode === 'publish'
                  ? 'Publishing makes the resource visible to everyone and sends a confirmation email to the uploader.'
                  : 'Rejection deletes the submission and notifies the uploader by email.'}
              </p>
            </div>

            <div className="px-6 py-5 flex flex-col gap-4">
              <div className="rounded-xl px-4 py-3" style={{ backgroundColor: 'var(--admin-soft)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--admin-text)' }}>
                  {modalResource.title}
                </p>
                <p className="text-xs" style={{ color: 'var(--admin-muted)' }}>
                  {modalResource.category.name} - {modalResource.uploadedBy.name}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: modalMode === 'publish' ? 'rgba(34, 197, 94, 0.14)' : 'rgba(248, 113, 113, 0.14)',
                    color: modalMode === 'publish' ? '#15803d' : '#b91c1c',
                  }}
                >
                  {modalMode === 'publish' ? 'Ready to publish' : 'Will remove from queue'}
                </span>
                <span className="text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#1d4ed8' }}>
                  Email notification
                </span>
              </div>

              {modalMode === 'reject' && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--admin-muted)' }}>
                    Rejection reason (optional)
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={4}
                    maxLength={500}
                    placeholder="Share a helpful reason so the uploader can improve their submission."
                    className="rounded-xl px-3 py-2 text-sm outline-none"
                    style={{ border: '1px solid var(--admin-border)', backgroundColor: 'var(--admin-surface)', color: 'var(--admin-text)', resize: 'none' }}
                  />
                  <p className="text-xs" style={{ color: 'var(--admin-muted)' }}>
                    This message is sent in the rejection email.
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-5 flex flex-col sm:flex-row gap-2" style={{ borderTop: '1px solid var(--admin-border)' }}>
              <button
                onClick={closeModal}
                className="flex-1 h-10 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: 'var(--admin-soft)', color: 'var(--admin-text)' }}
                disabled={acting === modalResource.id}
              >
                Cancel
              </button>
              <button
                onClick={handleModalConfirm}
                disabled={acting === modalResource.id}
                className="flex-1 h-10 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{
                  backgroundColor: modalMode === 'publish' ? '#22c55e' : '#ef4444',
                  color: '#ffffff',
                  boxShadow: modalMode === 'publish'
                    ? '0 12px 24px rgba(34, 197, 94, 0.25)'
                    : '0 12px 24px rgba(239, 68, 68, 0.25)',
                }}
              >
                {acting === modalResource.id
                  ? 'Working...'
                  : (modalMode === 'publish' ? 'Publish resource' : 'Reject resource')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk action confirmation modal */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setBulkModalOpen(false) }}>
          <div className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-4"
            style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>

            <h3 className="font-bold text-lg" style={{ color: 'var(--admin-text)' }}>
              {bulkMode === 'publish' ? 'Publish' : 'Reject'} {selected.size} resource{selected.size !== 1 ? 's' : ''}?
            </h3>

            <p className="text-sm" style={{ color: 'var(--admin-muted)' }}>
              {bulkMode === 'publish'
                ? `${selected.size} resources will be published and their uploaders notified.`
                : `${selected.size} resources will be permanently deleted and their uploaders notified.`}
            </p>

            {bulkMode === 'reject' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--admin-muted)' }}>
                  Reason (optional — sent to all uploaders)
                </label>
                <textarea
                  value={bulkReason}
                  onChange={(e) => setBulkReason(e.target.value)}
                  placeholder="Explain why these resources are being rejected..."
                  rows={3}
                  className="rounded-xl px-3 py-2 text-sm outline-none resize-none"
                  style={{ border: '1px solid var(--admin-border)', backgroundColor: 'var(--admin-soft)', color: 'var(--admin-text)' }}
                />
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setBulkModalOpen(false)}
                className="flex-1 h-10 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: 'var(--admin-soft)', color: 'var(--admin-text)' }}>
                Cancel
              </button>
              <button
                onClick={handleBulkAction}
                disabled={bulking}
                className="flex-1 h-10 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{
                  backgroundColor: bulkMode === 'publish' ? '#166534' : '#991b1b',
                  color: '#ffffff'
                }}>
                {bulking ? 'Processing…' : `${bulkMode === 'publish' ? 'Publish' : 'Reject'} all`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}