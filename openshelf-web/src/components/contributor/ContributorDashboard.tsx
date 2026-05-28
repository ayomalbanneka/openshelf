'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { http } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import {
  BookOpen, Download, Star, Users,
  Clock, CheckCircle, Hourglass,
  TrendingUp, ArrowRight,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────
interface Overview {
  totalUploads:   number
  publishedCount: number
  pendingCount:   number
  totalReviews:   number
  totalDownloads: number
  followerCount:  number
}

interface ResourceRow {
  id:            string
  title:         string
  slug:          string
  type:          string
  isPublished?:  boolean
  downloadCount: number
  createdAt?:    string
  _count:        { reviews: number }
}

interface Stats {
  overview:       Overview
  recentActivity: ResourceRow[]
  topResources:   ResourceRow[]
}

// ── Helpers ──────────────────────────────────────────────────
const fmt = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)

const relDate = (iso: string) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30)  return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const TYPE_COLORS: Record<string, string> = {
  BOOK:       '#1e40af',
  COURSE:     '#5b21b6',
  EXAM_PAPER: '#92400e',
  DOCUMENT:   '#065f46',
  AUDIO:      '#9d174d',
}

// ── Stat card ────────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, sub, color,
}: {
  icon:   React.ElementType
  label:  string
  value:  string | number
  sub?:   string
  color:  string
}) {
  return (
    <div
      className="flex flex-col gap-3 p-5 rounded-2xl"
      style={{
        backgroundColor: 'hsl(var(--background))',
        border:          '1px solid hsl(var(--border))',
        boxShadow:       '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}18` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        {sub && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
            {sub}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
          {typeof value === 'number' ? fmt(value) : value}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {label}
        </p>
      </div>
    </div>
  )
}

// ── Resource row ─────────────────────────────────────────────
function ResourceRow({
  resource, showDate = false,
}: {
  resource:  ResourceRow
  showDate?: boolean
}) {
  const color = TYPE_COLORS[resource.type] || '#1e40af'

  return (
    <Link
      href={`/resources/${resource.slug}`}
      className="flex items-center gap-3 px-4 py-3 transition-colors rounded-xl group"
      style={{ color: 'inherit' }}
      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'hsl(var(--muted))')}
      onMouseOut={(e)  => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      {/* Type dot */}
      <div
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />

      {/* Title */}
      <p
        className="flex-1 text-sm font-medium truncate group-hover:text-blue-600 transition-colors"
        style={{ color: 'hsl(var(--foreground))' }}
      >
        {resource.title}
      </p>

      {/* Status / date */}
      {showDate && resource.createdAt && (
        <span className="text-xs shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {relDate(resource.createdAt)}
        </span>
      )}
      {resource.isPublished !== undefined && (
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
          style={resource.isPublished
            ? { backgroundColor: '#dcfce7', color: '#166534' }
            : { backgroundColor: '#fef3c7', color: '#92400e' }}
        >
          {resource.isPublished ? 'Published' : 'Pending'}
        </span>
      )}

      {/* Stats */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="flex items-center gap-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
          <Download className="w-3 h-3" />
          {fmt(resource.downloadCount)}
        </span>
        <span className="flex items-center gap-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
          <Star className="w-3 h-3" />
          {resource._count.reviews}
        </span>
      </div>

      <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: 'hsl(var(--muted-foreground))' }} />
    </Link>
  )
}

// ── Section wrapper ──────────────────────────────────────────
function Section({ title, action, children }: {
  title:    string
  action?:  React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: 'hsl(var(--background))',
        border:          '1px solid hsl(var(--border))',
        boxShadow:       '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid hsl(var(--border))' }}
      >
        <h2 className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────
export function ContributorDashboard() {
  const { user }    = useAuthStore()
  const [stats, setStats]   = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  useEffect(() => {
    http.get('/users/me/stats')
      .then(({ data }) => setStats(data))
      .catch(() => setError('Failed to load your dashboard. Please refresh.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">
        <div className="h-8 w-48 rounded-xl animate-pulse" style={{ backgroundColor: 'hsl(var(--muted))' }} />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ backgroundColor: 'hsl(var(--muted))' }} />
          ))}
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="rounded-2xl px-6 py-10 text-center"
          style={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}>
          <p className="text-sm mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {error || 'Something went wrong.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs font-medium px-4 py-2 rounded-xl"
            style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const { overview, recentActivity, topResources } = stats

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
            My Dashboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Welcome back, {user?.name?.split(' ')[0]}
          </p>
        </div>
        <Link
          href="/upload"
          className="h-9 px-4 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors"
          style={{ backgroundColor: '#1e40af', color: '#ffffff' }}
        >
          <BookOpen className="w-4 h-4" />
          Upload resource
        </Link>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          icon={BookOpen}  label="Total uploads"
          value={overview.totalUploads}
          sub={`${overview.pendingCount} pending`}
          color="#1e40af"
        />
        <StatCard
          icon={CheckCircle} label="Published"
          value={overview.publishedCount}
          color="#166534"
        />
        <StatCard
          icon={Download}  label="Total downloads"
          value={overview.totalDownloads}
          color="#0f766e"
        />
        <StatCard
          icon={Star}      label="Reviews received"
          value={overview.totalReviews}
          color="#92400e"
        />
        <StatCard
          icon={Users}     label="Followers"
          value={overview.followerCount}
          color="#5b21b6"
        />
        <StatCard
          icon={Hourglass} label="Pending review"
          value={overview.pendingCount}
          color="#b45309"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">

        {/* Recent activity */}
        <Section
          title="Recent uploads"
          action={
            <Link href={`/user/${user?.id}`}
              className="text-xs font-medium transition-colors"
              style={{ color: 'hsl(var(--muted-foreground))' }}>
              View all
            </Link>
          }
        >
          {recentActivity.length === 0 ? (
            <div className="py-8 text-center text-sm px-4"
              style={{ color: 'hsl(var(--muted-foreground))' }}>
              No uploads yet.{' '}
              <Link href="/upload" className="text-blue-600 hover:underline">
                Upload your first resource
              </Link>
            </div>
          ) : (
            <div className="py-1">
              {recentActivity.map((r) => (
                <ResourceRow key={r.id} resource={r} showDate />
              ))}
            </div>
          )}
        </Section>

        {/* Top performing */}
        <Section
          title="Top resources"
          action={
            <div className="flex items-center gap-1 text-xs"
              style={{ color: 'hsl(var(--muted-foreground))' }}>
              <TrendingUp className="w-3.5 h-3.5" />
              By downloads
            </div>
          }
        >
          {topResources.length === 0 ? (
            <div className="py-8 text-center text-sm px-4"
              style={{ color: 'hsl(var(--muted-foreground))' }}>
              No published resources yet.
            </div>
          ) : (
            <div className="py-1">
              {topResources.map((r) => (
                <ResourceRow key={r.id} resource={r} />
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Empty state CTA */}
      {overview.totalUploads === 0 && (
        <div
          className="rounded-2xl px-8 py-10 text-center"
          style={{
            backgroundColor: 'hsl(var(--background))',
            border:          '1px dashed hsl(var(--border))',
          }}
        >
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <h3 className="font-semibold mb-1" style={{ color: 'hsl(var(--foreground))' }}>
            Start contributing
          </h3>
          <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Share books, courses, exam papers, and more with readers around the world.
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: '#1e40af', color: '#ffffff' }}
          >
            <BookOpen className="w-4 h-4" />
            Upload your first resource
          </Link>
        </div>
      )}
    </div>
  )
}