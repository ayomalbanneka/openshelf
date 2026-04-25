'use client'
import { useEffect, useState } from 'react'
import { http } from '@/lib/api'
import Link from 'next/link'

interface PendingResource {
  id: string
  title: string
  slug: string
  type: string
  language: string
  fileSize?: number
  mimeType?: string
  author?: string
  description?: string
  createdAt: string
  uploadedBy: { id: string; name: string; email: string }
  category: { name: string }
}

const TYPE_LABELS: Record<string, string> = {
  BOOK: 'Book', COURSE: 'Course',
  EXAM_PAPER: 'Exam paper', DOCUMENT: 'Document', AUDIO: 'Audio',
}

function formatBytes(bytes?: number) {
  if (!bytes) return '—'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function PendingPage() {
  const [resources, setResources] = useState<PendingResource[]>([])
  const [loading, setLoading]     = useState(true)
  const [total, setTotal]         = useState(0)
  const [acting, setActing]       = useState<string | null>(null)

  useEffect(() => {
    http.get('/admin/pending')
      .then((r) => {
        setResources(r.data.data)
        setTotal(r.data.meta.total)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handlePublish = async (id: string) => {
    setActing(id)
    try {
      await http.patch(`/admin/resources/${id}/publish`)
      setResources((prev) => prev.filter((r) => r.id !== id))
      setTotal((t) => t - 1)
    } catch {
      alert('Failed to publish')
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
    } catch {
      alert('Failed to reject')
    } finally {
      setActing(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-1">Pending review</h1>
        <p style={{ color: 'hsl(var(--muted-foreground))' }}>
          {total} resource{total !== 1 ? 's' : ''} waiting for moderation.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3].map((i) => (
            <div
              key={i}
              className="h-36 rounded-xl animate-pulse"
              style={{ backgroundColor: 'hsl(var(--muted))' }}
            />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-2xl text-center"
          style={{
            border: '2px dashed hsl(var(--border))',
            color: 'hsl(var(--muted-foreground))',
          }}
        >
          <span className="text-4xl mb-3">✅</span>
          <p className="text-lg font-medium mb-1">All caught up!</p>
          <p className="text-sm">No resources are waiting for review.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {resources.map((r) => (
            <div
              key={r.id}
              className="rounded-xl p-5 flex flex-col gap-3"
              style={{
                border: '1px solid hsl(var(--border))',
                backgroundColor: 'hsl(var(--background))',
              }}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: 'hsl(var(--muted))',
                        color: 'hsl(var(--muted-foreground))',
                      }}
                    >
                      {TYPE_LABELS[r.type]}
                    </span>
                    <span
                      className="text-xs uppercase shrink-0"
                      style={{ color: 'hsl(var(--muted-foreground))' }}
                    >
                      {r.language}
                    </span>
                  </div>
                  <h3 className="font-semibold leading-snug">{r.title}</h3>
                  {r.author && (
                    <p
                      className="text-sm mt-0.5"
                      style={{ color: 'hsl(var(--muted-foreground))' }}
                    >
                      by {r.author}
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 shrink-0">
                  <Link
                    href={`/resources/${r.slug}`}
                    target="_blank"
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      border: '1px solid hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                    }}
                  >
                    Preview
                  </Link>
                  <button
                    onClick={() => handlePublish(r.id)}
                    disabled={acting === r.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors disabled:opacity-50"
                    style={{ backgroundColor: '#059669' }}
                  >
                    {acting === r.id ? '…' : 'Publish'}
                  </button>
                  <button
                    onClick={() => handleReject(r.id, r.title)}
                    disabled={acting === r.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors disabled:opacity-50"
                    style={{ backgroundColor: '#dc2626' }}
                  >
                    {acting === r.id ? '…' : 'Reject'}
                  </button>
                </div>
              </div>

              {/* Description */}
              {r.description && (
                <p
                  className="text-sm line-clamp-2"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                  {r.description}
                </p>
              )}

              {/* Meta row */}
              <div
                className="flex flex-wrap gap-4 text-xs pt-2"
                style={{
                  color: 'hsl(var(--muted-foreground))',
                  borderTop: '1px solid hsl(var(--border))',
                }}
              >
                <span>
                  Uploaded by{' '}
                  <Link
                    href={`/users/${r.uploadedBy.id}`}
                    className="font-medium hover:text-blue-600 transition-colors"
                  >
                    {r.uploadedBy.name}
                  </Link>
                </span>
                <span>{r.uploadedBy.email}</span>
                <span>{r.category.name}</span>
                <span>{formatBytes(r.fileSize)}</span>
                <span>{new Date(r.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'short', day: 'numeric',
                })}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}