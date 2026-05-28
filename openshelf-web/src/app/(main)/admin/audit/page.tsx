'use client'
import { useEffect, useState, useRef } from 'react'
import { http } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'

interface AuditActor {
  id:   string
  name: string
  role: string
}

interface AuditLog {
  id:         string
  action:     string
  targetType: string
  targetId:   string
  targetName: string | null
  metadata:   Record<string, unknown> | null
  createdAt:  string
  actor:      AuditActor
}

// ── Formatting helpers ────────────────────────────────────────
const ACTION_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  RESOURCE_PUBLISHED:     { bg: '#dcfce7', text: '#166534', label: 'Published'        },
  RESOURCE_REJECTED:      { bg: '#fee2e2', text: '#991b1b', label: 'Rejected'         },
  RESOURCE_DELETED:       { bg: '#fee2e2', text: '#991b1b', label: 'Deleted'          },
  RESOURCE_EDITED:        { bg: '#eff6ff', text: '#1d4ed8', label: 'Edited'           },
  USER_ROLE_CHANGED:      { bg: '#fef3c7', text: '#92400e', label: 'Role changed'     },
  USER_ACTIVATED:         { bg: '#dcfce7', text: '#166534', label: 'Activated'        },
  USER_DEACTIVATED:       { bg: '#fee2e2', text: '#991b1b', label: 'Deactivated'      },
  USER_MESSAGED:          { bg: '#eff6ff', text: '#1d4ed8', label: 'Messaged'         },
  STAFF_INVITED:          { bg: '#f3e8ff', text: '#6b21a8', label: 'Staff invited'    },
  STAFF_PROMOTED:         { bg: '#f3e8ff', text: '#6b21a8', label: 'Staff promoted'   },
  STAFF_REVOKED:          { bg: '#fee2e2', text: '#991b1b', label: 'Access revoked'   },
  STAFF_INVITE_CANCELLED: { bg: '#fef3c7', text: '#92400e', label: 'Invite cancelled' },
  REPORT_RESOLVED:        { bg: '#dcfce7', text: '#166534', label: 'Report resolved'  },
  REPORT_DISMISSED:       { bg: '#f1f5f9', text: '#475569', label: 'Report dismissed' },
  CLUB_DELETED:           { bg: '#fee2e2', text: '#991b1b', label: 'Club deleted'     },
  CATEGORY_CREATED:       { bg: '#dcfce7', text: '#166634', label: 'Category created' },
  CATEGORY_DELETED:       { bg: '#fee2e2', text: '#991b1b', label: 'Category deleted' },
  TAG_DELETED:            { bg: '#fee2e2', text: '#991b1b', label: 'Tag deleted'      },
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    month:  'short', day: 'numeric', year: 'numeric',
    hour:   '2-digit', minute: '2-digit',
  })

const relativeTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)   return 'just now'
  if (mins  < 60)  return `${mins}m ago`
  if (hours < 24)  return `${hours}h ago`
  if (days  < 7)   return `${days}d ago`
  return fmt(iso)
}

const TARGET_ICONS: Record<string, string> = {
  Resource:    '📄',
  User:        '👤',
  Club:        '👥',
  Category:    '📁',
  Tag:         '🏷',
  StaffInvite: '✉️',
  Report:      '🚩',
}

const ALL_ACTIONS = Object.keys(ACTION_STYLE)

const TARGET_TYPES = ['Resource', 'User', 'Club', 'Category', 'Tag', 'StaffInvite', 'Report']

// ── Metadata renderer ─────────────────────────────────────────
function MetaBadges({ metadata }: { metadata: Record<string, unknown> | null }) {
  if (!metadata) return null
  const entries = Object.entries(metadata).filter(([, v]) => v !== null && v !== undefined)
  if (entries.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {entries.map(([key, val]) => (
        <span
          key={key}
          className="text-[10px] px-1.5 py-0.5 rounded-md font-mono"
          style={{ backgroundColor: 'var(--admin-soft)', color: 'var(--admin-muted)' }}
        >
          {key}: <span style={{ color: 'var(--admin-text)' }}>{String(val)}</span>
        </span>
      ))}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────
export default function AuditPage() {
  const [logs, setLogs]             = useState<AuditLog[]>([])
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)
  const [pages, setPages]           = useState(1)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [actionFilter, setActionFilter]     = useState('')
  const [targetTypeFilter, setTargetTypeFilter] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const limit = 20
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const fetch_ = (action = actionFilter, targetType = targetTypeFilter, p = page) => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams({ page: String(p), limit: String(limit) })
    if (action)     params.set('action', action)
    if (targetType) params.set('targetType', targetType)

    http.get(`/admin/audit?${params}`)
      .then(({ data }) => {
        setLogs(data.data)
        setTotal(data.meta.total)
        setPages(data.meta.pages)
        setPage(data.meta.page)
      })
      .catch((err) => setError(getErrorMessage(err, 'Failed to load audit logs')))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetch_() }, [])
  useEffect(() => { fetch_(actionFilter, targetTypeFilter, page) }, [page])

  const handleActionFilter = (val: string) => {
    setActionFilter(val)
    setPage(1)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => fetch_(val, targetTypeFilter, 1), 100)
  }

  const handleTargetFilter = (val: string) => {
    setTargetTypeFilter(val)
    setPage(1)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => fetch_(actionFilter, val, 1), 100)
  }

  const inputStyle = {
    border:          '1px solid var(--admin-border)',
    backgroundColor: 'var(--admin-surface)',
    color:           'var(--admin-text)',
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--admin-text)' }}>
            Audit Log
          </h1>
          <p className="text-sm" style={{ color: 'var(--admin-muted)' }}>
            {total.toLocaleString()} action{total !== 1 ? 's' : ''} recorded
          </p>
        </div>
        <button
          onClick={() => fetch_()}
          className="text-xs px-3 py-1.5 rounded-xl font-semibold"
          style={{ backgroundColor: 'var(--admin-soft)', color: 'var(--admin-text)' }}
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={actionFilter}
          onChange={(e) => handleActionFilter(e.target.value)}
          className="h-9 rounded-xl px-3 text-sm outline-none"
          style={inputStyle}
        >
          <option value="">All actions</option>
          {ALL_ACTIONS.map((a) => (
            <option key={a} value={a}>{ACTION_STYLE[a]?.label ?? a}</option>
          ))}
        </select>

        <select
          value={targetTypeFilter}
          onChange={(e) => handleTargetFilter(e.target.value)}
          className="h-9 rounded-xl px-3 text-sm outline-none"
          style={inputStyle}
        >
          <option value="">All targets</option>
          {TARGET_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {(actionFilter || targetTypeFilter) && (
          <button
            onClick={() => { handleActionFilter(''); handleTargetFilter('') }}
            className="h-9 px-3 rounded-xl text-sm font-medium"
            style={{ backgroundColor: 'var(--admin-soft)', color: 'var(--admin-muted)' }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between gap-3 text-sm rounded-xl px-4 py-3"
          style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
          <span>{error}</span>
          <button onClick={() => fetch_()}
            className="text-xs px-3 py-1.5 rounded-xl font-semibold"
            style={{ backgroundColor: '#fecaca', color: '#7f1d1d' }}>
            Retry
          </button>
        </div>
      )}

      {/* Log table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: 'var(--admin-surface)',
          border:          '1px solid var(--admin-border)',
          boxShadow:       'var(--admin-card-shadow)',
        }}
      >
        {/* Column headers */}
        <div
          className="grid grid-cols-12 gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider"
          style={{
            backgroundColor: 'var(--admin-soft)',
            color:           'var(--admin-muted)',
            borderBottom:    '1px solid var(--admin-border)',
          }}
        >
          <div className="col-span-2">When</div>
          <div className="col-span-2">Actor</div>
          <div className="col-span-2">Action</div>
          <div className="col-span-4">Target</div>
          <div className="col-span-2">Details</div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-0">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-14 mx-4 my-2 rounded-xl animate-pulse"
                style={{ backgroundColor: 'var(--admin-soft)' }} />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-sm" style={{ color: 'var(--admin-muted)' }}>
            No audit logs found.
          </div>
        ) : (
          logs.map((log, i) => {
            const style    = ACTION_STYLE[log.action] ?? { bg: '#f1f5f9', text: '#475569', label: log.action }
            const icon     = TARGET_ICONS[log.targetType] ?? '•'
            const expanded = expandedId === log.id

            return (
              <div
                key={log.id}
                style={{ borderTop: i === 0 ? 'none' : '1px solid var(--admin-border)' }}
              >
                <div
                  className="grid grid-cols-12 gap-3 px-4 py-3 items-start text-sm cursor-pointer transition-colors"
                  onClick={() => setExpandedId(expanded ? null : log.id)}
                  style={{ backgroundColor: expanded ? 'var(--admin-soft)' : 'transparent' }}
                  onMouseOver={(e) => {
                    if (!expanded)
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--admin-soft)'
                  }}
                  onMouseOut={(e) => {
                    if (!expanded)
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'
                  }}
                >
                  {/* When */}
                  <div className="col-span-2">
                    <p className="text-xs font-medium" style={{ color: 'var(--admin-text)' }}>
                      {relativeTime(log.createdAt)}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--admin-muted)' }}>
                      {fmt(log.createdAt)}
                    </p>
                  </div>

                  {/* Actor */}
                  <div className="col-span-2 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                        style={{
                          background: log.actor.role === 'ADMIN'
                            ? 'linear-gradient(135deg,#dc2626,#991b1b)'
                            : 'linear-gradient(135deg,#d97706,#92400e)',
                        }}
                      >
                        {log.actor.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: 'var(--admin-text)' }}>
                          {log.actor.name}
                        </p>
                        <p className="text-[10px]" style={{ color: 'var(--admin-muted)' }}>
                          {log.actor.role}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action badge */}
                  <div className="col-span-2">
                    <span
                      className="text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap"
                      style={{ backgroundColor: style.bg, color: style.text }}
                    >
                      {style.label}
                    </span>
                  </div>

                  {/* Target */}
                  <div className="col-span-4 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm shrink-0">{icon}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: 'var(--admin-text)' }}>
                          {log.targetName ?? log.targetId}
                        </p>
                        <p className="text-[10px]" style={{ color: 'var(--admin-muted)' }}>
                          {log.targetType}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Expand toggle */}
                  <div className="col-span-2 flex items-center justify-end">
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-lg font-medium"
                        style={{ backgroundColor: 'var(--admin-soft)', color: 'var(--admin-muted)' }}
                      >
                        {expanded ? '▲ Less' : '▼ Details'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded metadata row */}
                {expanded && log.metadata && (
                  <div
                    className="px-4 py-3"
                    style={{
                      backgroundColor: 'var(--admin-soft)',
                      borderTop:       '1px solid var(--admin-border)',
                    }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-2"
                      style={{ color: 'var(--admin-muted)' }}>
                      Metadata
                    </p>
                    <MetaBadges metadata={log.metadata} />
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
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
          <span className="text-xs" style={{ color: 'var(--admin-muted)' }}>
            Page {page} of {pages}
          </span>
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