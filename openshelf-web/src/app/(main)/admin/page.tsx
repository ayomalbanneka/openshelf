'use client'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { http } from '@/lib/api'
import Link from 'next/link'

interface Stats {
  totalUsers: number
  totalResources: number
  publishedResources: number
  pendingResources: number
  totalReviews: number
  totalClubs: number
}

interface RecentUpload {
  id: string
  title: string
  slug: string
  type: string
  createdAt: string
  uploadedBy: { id: string; name: string }
  category: { name: string }
}

function StatCard({
  label,
  value,
  sub,
  colour,
}: {
  label: string
  value: number
  sub?: string
  colour: string
}) {
  return (
    <div
      className="p-5 rounded-xl flex flex-col gap-1"
      style={{
        border: '1px solid hsl(var(--border))',
        backgroundColor: 'hsl(var(--background))',
      }}
    >
      <p
        className="text-xs font-medium uppercase tracking-wider"
        style={{ color: 'hsl(var(--muted-foreground))' }}
      >
        {label}
      </p>
      <p className="text-3xl font-bold" style={{ color: colour }}>
        {value.toLocaleString()}
      </p>
      {sub && (
        <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {sub}
        </p>
      )}
    </div>
  )
}

export default function AdminPage() {
  const { user } = useAuthStore()
  const [stats, setStats]     = useState<Stats | null>(null)
  const [recent, setRecent]   = useState<RecentUpload[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    http.get('/admin/stats')
      .then((r) => {
        setStats(r.data.stats)
        setRecent(r.data.recentUploads)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map((i) => (
            <div
              key={i}
              className="h-28 rounded-xl animate-pulse"
              style={{ backgroundColor: 'hsl(var(--muted))' }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="flex flex-col gap-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-1">Overview</h1>
        <p style={{ color: 'hsl(var(--muted-foreground))' }}>
          Welcome back, {user?.name?.split(' ')[0]}.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          label="Total users"
          value={stats.totalUsers}
          colour="#2563eb"
        />
        <StatCard
          label="Total resources"
          value={stats.totalResources}
          sub={`${stats.publishedResources} published`}
          colour="#059669"
        />
        <StatCard
          label="Pending review"
          value={stats.pendingResources}
          sub="Awaiting moderation"
          colour={stats.pendingResources > 0 ? '#d97706' : '#059669'}
        />
        <StatCard
          label="Total reviews"
          value={stats.totalReviews}
          colour="#7c3aed"
        />
        <StatCard
          label="Reading clubs"
          value={stats.totalClubs}
          colour="#db2777"
        />
      </div>

      {/* Pending alert */}
      {stats.pendingResources > 0 && (
        <div
          className="flex items-center justify-between p-4 rounded-xl"
          style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fcd34d',
          }}
        >
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 20 }}>⏳</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {stats.pendingResources} resource
                {stats.pendingResources !== 1 ? 's' : ''} awaiting review
              </p>
              <p className="text-xs text-amber-700">
                Review and publish them to make them visible to users.
              </p>
            </div>
          </div>
          <Link
            href="/admin/pending"
            className="px-4 py-2 rounded-lg text-sm font-medium text-white shrink-0"
            style={{ backgroundColor: '#d97706' }}
          >
            Review now
          </Link>
        </div>
      )}

      {/* Recent uploads */}
      <div>
        <h2 className="text-lg font-bold mb-4">Recent uploads</h2>
        {recent.length === 0 ? (
          <p
            className="text-sm"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            No uploads yet.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {recent.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-4 p-3 rounded-xl"
                style={{
                  border: '1px solid hsl(var(--border))',
                  backgroundColor: 'hsl(var(--background))',
                }}
              >
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/resources/${r.slug}`}
                    className="text-sm font-medium hover:text-blue-600 transition-colors truncate block"
                  >
                    {r.title}
                  </Link>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                  >
                    by {r.uploadedBy.name} · {r.category.name} ·{' '}
                    {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: 'hsl(var(--muted))',
                    color: 'hsl(var(--muted-foreground))',
                  }}
                >
                  {r.type.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}