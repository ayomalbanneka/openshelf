'use client'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { http } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import Link from 'next/link'

interface Stats {
  totalUsers: number
  totalResources: number
  publishedResources: number
  pendingResources: number
  totalReviews: number
  totalClubs: number
  totalTags: number
}

interface RecentUpload {
  id: string; title: string; slug: string; type: string
  createdAt: string; isPublished: boolean
  uploadedBy: { id: string; name: string }
  category: { name: string }
}

interface TypeCount { type: string; _count: number }
interface RoleCount { role: string; _count: number }
interface DayCount  { date: string; count: number }

const TYPE_ICONS: Record<string, string> = {
  BOOK: '📖', COURSE: '🎓', EXAM_PAPER: '📝', DOCUMENT: '📄', AUDIO: '🎵',
}
const TYPE_COLORS: Record<string, string> = {
  BOOK: '#0ea5e9', COURSE: '#14b8a6', EXAM_PAPER: '#f59e0b',
  DOCUMENT: '#22c55e', AUDIO: '#f43f5e',
}

function StatCard({ icon, label, value, sub, color, href }: {
  icon: string; label: string; value: number; sub?: string
  color: string; href?: string
}) {
  const card = (
    <div
      className="rounded-2xl p-5 flex items-start gap-4 transition-all hover:-translate-y-0.5"
      style={{
        backgroundColor: 'var(--admin-surface)',
        boxShadow: 'var(--admin-card-shadow)',
        border: '1px solid var(--admin-border)',
      }}
    >
      <div
        className="h-11 w-11 rounded-xl flex items-center justify-center text-xl shrink-0"
        style={{ backgroundColor: `${color}18` }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold leading-tight" style={{ color }}>{value.toLocaleString()}</p>
        <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--admin-muted)' }}>{label}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--admin-muted)' }}>{sub}</p>}
      </div>
      <div className="h-1 w-full absolute bottom-0 left-0 rounded-b-2xl" style={{ backgroundColor: color, opacity: 0.3 }} />
    </div>
  )
  return href ? <Link href={href} className="block relative overflow-hidden">{card}</Link>
    : <div className="relative overflow-hidden">{card}</div>
}

// Mini bar chart
function BarChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="flex items-end gap-1.5 h-24">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-md transition-all"
            style={{ height: `${Math.max((d.value / max) * 96, 4)}px`, backgroundColor: color, opacity: 0.85 }}
          />
          <span className="text-[9px] font-medium" style={{ color: 'var(--admin-muted)' }}>{d.label}</span>
        </div>
      ))}
    </div>
  )
}

// Donut segment chart (pure SVG)
function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  let offset = 0
  const r = 40, cx = 50, cy = 50, stroke = 14
  const circumference = 2 * Math.PI * r
  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 100 100" className="h-28 w-28 shrink-0 -rotate-90">
        {segments.map((seg) => {
          const pct = seg.value / total
          const dashArray = `${pct * circumference} ${circumference}`
          const dashOffset = -offset * circumference
          offset += pct
          return (
            <circle
              key={seg.label}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={stroke}
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
            />
          )
        })}
      </svg>
      <div className="flex flex-col gap-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-xs" style={{ color: 'var(--admin-muted)' }}>
              {seg.label} <span className="font-semibold" style={{ color: 'var(--admin-text)' }}>{seg.value}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminPage() {
  const { user } = useAuthStore()
  const [stats, setStats]           = useState<Stats | null>(null)
  const [recent, setRecent]         = useState<RecentUpload[]>([])
  const [typeData, setTypeData]     = useState<TypeCount[]>([])
  const [roleData, setRoleData]     = useState<RoleCount[]>([])
  const [dayData, setDayData]       = useState<DayCount[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')

  const fetchStats = () => {
    if (!user) return
    setLoading(true)
    setError('')
    http.get('/admin/stats')
      .then((r) => {
        setStats(r.data.stats)
        setRecent(r.data.recentUploads)
        setTypeData(r.data.resourcesByType || [])
        setRoleData(r.data.usersByRole || [])
        setDayData(r.data.uploadsByDay || [])
      })
      .catch((err) => setError(getErrorMessage(err, 'Failed to load dashboard')))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchStats()
  }, [user])

  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        <div className="h-8 w-48 rounded-xl animate-pulse" style={{ backgroundColor: '#e2e8f0' }} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7].map((i) => (
            <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ backgroundColor: '#e2e8f0' }} />
          ))}
        </div>
      </div>
    )
  }

  if (error && !stats) {
    return (
      <div className="flex flex-col gap-4">
        <div className="text-sm rounded-xl px-4 py-3" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
          {error}
        </div>
        <button
          onClick={fetchStats}
          className="text-xs px-3 py-1.5 rounded-xl font-semibold"
          style={{ backgroundColor: 'var(--admin-soft)', color: 'var(--admin-text)' }}
        >
          Retry
        </button>
      </div>
    )
  }

  if (!stats) return null

  const isAdmin = user?.role === 'ADMIN'

  // Last 7 days bar chart data
  const today = new Date()
  const chartDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (6 - i))
    const key = d.toISOString().split('T')[0]
    const found = dayData.find((x) => String(x.date).startsWith(key))
    return { label: d.toLocaleDateString('en', { weekday: 'short' }).slice(0, 2), value: Number(found?.count ?? 0) }
  })

  const typeSegments = typeData.map((t) => ({
    label: t.type.replace('_', ' '),
    value: Number(t._count),
    color: TYPE_COLORS[t.type] ?? '#94a3b8',
  }))

  const roleSegments = roleData.map((r) => ({
    label: r.role,
    value: Number(r._count),
    color: r.role === 'ADMIN' ? '#dc2626' : r.role === 'MODERATOR' ? '#d97706' : '#2563eb',
  }))

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--admin-text)' }}>Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--admin-muted)' }}>
            Welcome back, {user?.name?.split(' ')[0]}. Here's what's happening.
          </p>
        </div>
        <div
          className="text-xs px-3 py-1.5 rounded-full font-semibold"
          style={
            user?.role === 'ADMIN'
              ? { backgroundColor: '#fee2e2', color: '#991b1b' }
              : { backgroundColor: '#fef3c7', color: '#92400e' }
          }
        >
          {user?.role}
        </div>
      </div>

      {/* Pending banner */}
      {stats.pendingResources > 0 && (
        <div
          className="flex items-center justify-between p-4 rounded-2xl"
          style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: '#fef3c7' }}
            >
              ⏳
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#92400e' }}>
                {stats.pendingResources} resource{stats.pendingResources !== 1 ? 's' : ''} awaiting review
              </p>
              <p className="text-xs" style={{ color: '#b45309' }}>
                Review and approve to make them visible to all users.
              </p>
            </div>
          </div>
          <Link
            href="/admin/pending"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white shrink-0 transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#f59e0b' }}
          >
            Review now →
          </Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="👥" label="Total users"     value={stats.totalUsers}          color="#2563eb" href={isAdmin ? '/admin/users' : undefined} />
        <StatCard icon="📚" label="Resources"       value={stats.totalResources}      color="#059669" sub={`${stats.publishedResources} published`} href={isAdmin ? '/admin/resources' : undefined} />
        <StatCard icon="⏳" label="Pending review"  value={stats.pendingResources}    color="#d97706" href="/admin/pending" />
        <StatCard icon="⭐" label="Total reviews"   value={stats.totalReviews}        color="#06b6d4" />
        {isAdmin && (
          <>
            <StatCard icon="🏛️" label="Reading clubs"   value={stats.totalClubs}     color="#db2777" href="/admin/clubs" />
            <StatCard icon="🏷️" label="Tags"            value={stats.totalTags}      color="#0891b2" href="/admin/tags" />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Uploads this week */}
          <div
            className="rounded-2xl p-5 lg:col-span-2"
            style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', boxShadow: 'var(--admin-card-shadow)' }}
          >
          <div className="flex items-center justify-between mb-5">
            <div>
                <p className="text-sm font-bold" style={{ color: 'var(--admin-text)' }}>Uploads this week</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--admin-muted)' }}>New resources uploaded per day</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
              Last 7 days
            </span>
          </div>
          <BarChart data={chartDays} color="#2563eb" />
        </div>

        {/* Resource types */}
        {typeSegments.length > 0 && (
          <div
            className="rounded-2xl p-5"
            style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', boxShadow: 'var(--admin-card-shadow)' }}
          >
            <p className="text-sm font-bold mb-1" style={{ color: 'var(--admin-text)' }}>Resource types</p>
            <p className="text-xs mb-4" style={{ color: 'var(--admin-muted)' }}>Published resources by type</p>
            <DonutChart segments={typeSegments} />
          </div>
        )}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Recent uploads table */}
        <div
          className="rounded-2xl overflow-hidden lg:col-span-2"
          style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', boxShadow: 'var(--admin-card-shadow)' }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid var(--admin-border)' }}
          >
            <p className="text-sm font-bold" style={{ color: 'var(--admin-text)' }}>Recent uploads</p>
            <Link href="/admin/pending" className="text-xs font-medium" style={{ color: '#2563eb' }}>
              View pending →
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="py-12 text-center text-sm" style={{ color: 'var(--admin-muted)' }}>No uploads yet.</div>
          ) : (
            <div className="divide-y" style={{ borderColor: '#f1f5f9' }}>
              {recent.map((r) => (
                <div key={r.id} className="flex items-center gap-4 px-5 py-3">
                  {/* Type icon */}
                  <div
                    className="h-9 w-9 rounded-lg flex items-center justify-center text-base shrink-0"
                    style={{ backgroundColor: `${TYPE_COLORS[r.type] ?? '#94a3b8'}15` }}
                  >
                    {TYPE_ICONS[r.type] ?? '📄'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/resources/${r.slug}`}
                      className="text-sm font-medium hover:text-blue-600 transition-colors truncate block"
                      style={{ color: '#1e293b' }}
                    >
                      {r.title}
                    </Link>
                    <p className="text-xs mt-0.5 truncate" style={{ color: '#94a3b8' }}>
                      {r.uploadedBy.name} · {r.category.name}
                    </p>
                  </div>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                    style={
                      r.isPublished
                        ? { backgroundColor: '#dcfce7', color: '#166534' }
                        : { backgroundColor: '#fef3c7', color: '#92400e' }
                    }
                  >
                    {r.isPublished ? 'Published' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User roles breakdown */}
        {isAdmin && roleSegments.length > 0 && (
          <div
            className="rounded-2xl p-5"
            style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', boxShadow: 'var(--admin-card-shadow)' }}
          >
            <p className="text-sm font-bold mb-1" style={{ color: 'var(--admin-text)' }}>User roles</p>
            <p className="text-xs mb-4" style={{ color: 'var(--admin-muted)' }}>Breakdown by account type</p>
            <DonutChart segments={roleSegments} />

            <div
              className="mt-5 pt-4 flex flex-col gap-2"
              style={{ borderTop: '1px solid #f1f5f9' }}
            >
              <Link
                href="/admin/users"
                className="flex items-center justify-between text-sm font-medium px-3 py-2 rounded-xl transition-colors hover:bg-slate-50"
                style={{ color: '#2563eb' }}
              >
                <span>Manage users</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}