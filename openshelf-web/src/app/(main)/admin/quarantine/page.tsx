'use client'
import { useEffect, useState } from 'react'
import { http } from '@/lib/api'
import { toast } from '@/lib/toast'
import { getErrorMessage } from '@/lib/errors'
import {
  ShieldAlert, ShieldCheck, Trash2, Loader2,
  AlertTriangle, Clock, FileX, RefreshCw, User, Tag,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

type ScanStatus = 'INFECTED' | 'ERROR'

interface QuarantinedResource {
  id:          string
  title:       string
  type:        string
  mimeType:    string | null
  fileSize:    number | null
  scanStatus:  ScanStatus
  scanError:   string | null
  createdAt:   string
  updatedAt:   string
  uploadedBy:  { id: string; name: string; email: string }
  category:    { id: string; name: string }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBytes(bytes: number | null) {
  if (!bytes) return '—'
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)  return 'just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

// ── Status pill ───────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: ScanStatus }) {
  if (status === 'INFECTED') {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
        style={{ background: 'hsl(0 84% 60% / 0.12)', color: 'hsl(0 84% 40%)' }}
      >
        <ShieldAlert size={11} /> Infected
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: 'hsl(38 92% 50% / 0.12)', color: 'hsl(38 92% 35%)' }}
    >
      <AlertTriangle size={11} /> Scan error
    </span>
  )
}

// ── Resource card ─────────────────────────────────────────────────────────────

function QuarantineCard({
  resource,
  onRelease,
  onDelete,
  acting,
}: {
  resource:  QuarantinedResource
  onRelease: (id: string) => void
  onDelete:  (id: string) => void
  acting:    string | null
}) {
  const isActing = acting === resource.id

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        border:     resource.scanStatus === 'INFECTED'
          ? '1px solid hsl(0 84% 60% / 0.25)'
          : '1px solid hsl(38 92% 50% / 0.3)',
        background: 'var(--admin-card)',
      }}
    >
      {/* Card header */}
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{
          background:   resource.scanStatus === 'INFECTED'
            ? 'hsl(0 84% 60% / 0.06)'
            : 'hsl(38 92% 50% / 0.06)',
          borderBottom: resource.scanStatus === 'INFECTED'
            ? '1px solid hsl(0 84% 60% / 0.15)'
            : '1px solid hsl(38 92% 50% / 0.15)',
        }}
      >
        <div className="flex items-center gap-2">
          <FileX
            size={15}
            style={{
              color: resource.scanStatus === 'INFECTED'
                ? 'hsl(0 84% 50%)'
                : 'hsl(38 92% 45%)',
            }}
          />
          <span className="text-sm font-semibold truncate max-w-xs">{resource.title}</span>
        </div>
        <StatusPill status={resource.scanStatus} />
      </div>

      {/* Card body */}
      <div className="px-5 py-4 flex flex-col gap-4">

        {/* Threat detail */}
        {resource.scanError && (
          <div
            className="flex items-start gap-2.5 p-3 rounded-xl text-xs"
            style={{
              background: resource.scanStatus === 'INFECTED'
                ? 'hsl(0 84% 60% / 0.08)'
                : 'hsl(38 92% 50% / 0.08)',
              color: resource.scanStatus === 'INFECTED'
                ? 'hsl(0 84% 35%)'
                : 'hsl(38 92% 30%)',
            }}
          >
            <ShieldAlert size={13} className="mt-0.5 shrink-0" />
            <span className="font-mono break-all">{resource.scanError}</span>
          </div>
        )}

        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--admin-muted)' }}>
            <User size={12} className="shrink-0" />
            <span className="truncate">
              {resource.uploadedBy.name}
              <span className="block text-[10px] opacity-70">{resource.uploadedBy.email}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--admin-muted)' }}>
            <Tag size={12} className="shrink-0" />
            <span>{resource.type} · {resource.category.name}</span>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--admin-muted)' }}>
            <FileX size={12} className="shrink-0" />
            <span>{formatBytes(resource.fileSize)} · {resource.mimeType ?? '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--admin-muted)' }}>
            <Clock size={12} className="shrink-0" />
            <span>Flagged {timeAgo(resource.updatedAt)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          {/* Release — only meaningful for INFECTED (false positive review) */}
          <button
            onClick={() => onRelease(resource.id)}
            disabled={!!acting}
            className="flex-1 h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            style={{
              border:   '1px solid var(--admin-border)',
              color:    'var(--admin-text)',
              opacity:  acting ? 0.5 : 1,
              cursor:   acting ? 'not-allowed' : 'pointer',
              background: 'transparent',
            }}
          >
            {isActing
              ? <Loader2 size={12} className="animate-spin" />
              : <ShieldCheck size={12} />}
            Mark safe &amp; restore
          </button>

          {/* Permanently delete */}
          <button
            onClick={() => onDelete(resource.id)}
            disabled={!!acting}
            className="flex-1 h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            style={{
              background: 'hsl(0 84% 60% / 0.1)',
              border:     '1px solid hsl(0 84% 60% / 0.25)',
              color:      'hsl(0 84% 40%)',
              opacity:    acting ? 0.5 : 1,
              cursor:     acting ? 'not-allowed' : 'pointer',
            }}
          >
            {isActing
              ? <Loader2 size={12} className="animate-spin" />
              : <Trash2 size={12} />}
            Delete permanently
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Confirm modal ─────────────────────────────────────────────────────────────

function ConfirmModal({
  open,
  mode,
  resourceTitle,
  onConfirm,
  onCancel,
  loading,
}: {
  open:         boolean
  mode:         'release' | 'delete'
  resourceTitle: string
  onConfirm:    () => void
  onCancel:     () => void
  loading:      boolean
}) {
  if (!open) return null

  const isDelete = mode === 'delete'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={loading ? undefined : onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-4"
        style={{ background: 'var(--admin-card)', border: '1px solid var(--admin-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: isDelete ? 'hsl(0 84% 60% / 0.1)' : 'hsl(142 71% 45% / 0.1)',
            }}
          >
            {isDelete
              ? <Trash2    size={18} style={{ color: 'hsl(0 84% 50%)' }} />
              : <ShieldCheck size={18} style={{ color: 'hsl(142 71% 40%)' }} />}
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--admin-text)' }}>
              {isDelete ? 'Delete permanently?' : 'Mark as safe and restore?'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--admin-muted)' }}>
              {isDelete
                ? `"${resourceTitle}" will be permanently deleted from storage and the database. This cannot be undone.`
                : `"${resourceTitle}" will be moved back to active storage and marked as clean. Only do this if you have manually verified the file is safe.`}
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              border:   '1px solid var(--admin-border)',
              color:    'var(--admin-muted)',
              background: 'transparent',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
            style={{
              background: isDelete ? 'hsl(0 84% 55%)' : 'hsl(142 71% 40%)',
              color:      '#fff',
              opacity:    loading ? 0.7 : 1,
              cursor:     loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading && <Loader2 size={12} className="animate-spin" />}
            {isDelete ? 'Yes, delete' : 'Yes, restore'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function QuarantinePage() {
  const [resources, setResources] = useState<QuarantinedResource[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [acting,    setActing]    = useState<string | null>(null)
  const [filter,    setFilter]    = useState<'ALL' | 'INFECTED' | 'ERROR'>('ALL')

  const [modal, setModal] = useState<{
    open:      boolean
    mode:      'release' | 'delete'
    id:        string
    title:     string
  }>({ open: false, mode: 'delete', id: '', title: '' })

  const fetchQuarantined = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await http.get<QuarantinedResource[]>('/admin/quarantine')
      setResources(data)
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load quarantined resources'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchQuarantined() }, [])

  const openModal = (mode: 'release' | 'delete', id: string, title: string) => {
    setModal({ open: true, mode, id, title })
  }

  const closeModal = () => {
    if (acting) return
    setModal((m) => ({ ...m, open: false }))
  }

  const handleConfirm = async () => {
    setActing(modal.id)
    try {
      if (modal.mode === 'release') {
        await http.patch(`/admin/quarantine/${modal.id}/release`)
        toast.success('Resource restored and marked clean.')
      } else {
        await http.delete(`/admin/quarantine/${modal.id}`)
        toast.success('Resource permanently deleted.')
      }
      setResources((prev) => prev.filter((r) => r.id !== modal.id))
      setModal((m) => ({ ...m, open: false }))
    } catch (err) {
      toast.error(getErrorMessage(err, 'Action failed. Please try again.'))
    } finally {
      setActing(null)
    }
  }

  const filtered = filter === 'ALL'
    ? resources
    : resources.filter((r) => r.scanStatus === filter)

  const infectedCount = resources.filter((r) => r.scanStatus === 'INFECTED').length
  const errorCount    = resources.filter((r) => r.scanStatus === 'ERROR').length

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-2xl font-bold flex items-center gap-2"
            style={{ color: 'var(--admin-text)' }}
          >
            <ShieldAlert size={22} style={{ color: 'hsl(0 84% 50%)' }} />
            Quarantine
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--admin-muted)' }}>
            Files flagged by the safety scanner. Review each one before taking action.
          </p>
        </div>
        <button
          onClick={fetchQuarantined}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
          style={{
            border:     '1px solid var(--admin-border)',
            color:      'var(--admin-text)',
            background: 'transparent',
          }}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total flagged',  value: resources.length,  color: 'var(--admin-text)',       bg: 'var(--admin-soft)' },
          { label: 'Infected',       value: infectedCount,     color: 'hsl(0 84% 40%)',          bg: 'hsl(0 84% 60% / 0.08)' },
          { label: 'Scan errors',    value: errorCount,        color: 'hsl(38 92% 35%)',         bg: 'hsl(38 92% 50% / 0.08)' },
        ].map(({ label, value, color, bg }) => (
          <div
            key={label}
            className="rounded-2xl p-4"
            style={{ background: bg, border: '1px solid var(--admin-border)' }}
          >
            <p className="text-xs font-medium" style={{ color: 'var(--admin-muted)' }}>{label}</p>
            <p className="text-3xl font-bold mt-1" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['ALL', 'INFECTED', 'ERROR'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: filter === f ? 'var(--admin-sidebar-active)' : 'transparent',
              color:      filter === f ? 'var(--admin-sidebar-text)' : 'var(--admin-muted)',
              border:     '1px solid var(--admin-border)',
            }}
          >
            {f === 'ALL' ? `All (${resources.length})` :
             f === 'INFECTED' ? `Infected (${infectedCount})` :
             `Scan errors (${errorCount})`}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--admin-muted)' }} />
        </div>
      ) : error ? (
        <div
          className="p-4 rounded-xl text-sm"
          style={{ background: 'hsl(0 84% 60% / 0.08)', color: 'hsl(0 84% 40%)' }}
        >
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <ShieldCheck size={40} style={{ color: 'hsl(142 71% 45%)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--admin-text)' }}>
            {filter === 'ALL' ? 'No quarantined files' : `No ${filter.toLowerCase()} files`}
          </p>
          <p className="text-xs" style={{ color: 'var(--admin-muted)' }}>
            All uploads are clean.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filtered.map((resource) => (
            <QuarantineCard
              key={resource.id}
              resource={resource}
              acting={acting}
              onRelease={(id) => openModal('release', id, resource.title)}
              onDelete={(id)  => openModal('delete',  id, resource.title)}
            />
          ))}
        </div>
      )}

      {/* Confirm modal */}
      <ConfirmModal
        open={modal.open}
        mode={modal.mode}
        resourceTitle={modal.title}
        onConfirm={handleConfirm}
        onCancel={closeModal}
        loading={!!acting}
      />
    </div>
  )
}