'use client'
import { useEffect, useState } from 'react'
import { http } from '@/lib/api'

interface Tag {
  id: string; name: string; slug: string
  _count: { resources: number }
}

export default function TagsPage() {
  const [tags, setTags]       = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing]   = useState<string | null>(null)

  const fetch_ = () => {
    setLoading(true)
    http.get('/admin/tags')
      .then((r) => setTags(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetch_() }, [])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete tag "#${name}"?`)) return
    setActing(id)
    try {
      await http.delete(`/admin/tags/${id}`)
      setTags((p) => p.filter((t) => t.id !== id))
    } finally { setActing(null) }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#0f172a' }}>Tags</h1>
        <p className="text-sm" style={{ color: '#64748b' }}>{tags.length} tags in use across all resources.</p>
      </div>

      {loading ? (
        <div className="flex flex-wrap gap-2">
          {[1,2,3,4,5,6,7,8].map((i) => (
            <div key={i} className="h-8 w-24 rounded-full animate-pulse" style={{ backgroundColor: '#e2e8f0' }} />
          ))}
        </div>
      ) : tags.length === 0 ? (
        <div className="py-16 text-center text-sm rounded-2xl" style={{ border: '2px dashed #e2e8f0', color: '#94a3b8' }}>
          No tags yet.
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div className="grid grid-cols-12 gap-3 px-5 py-3 text-xs font-bold uppercase tracking-wider"
            style={{ backgroundColor: '#f8fafc', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
            <div className="col-span-5">Tag</div>
            <div className="col-span-4">Slug</div>
            <div className="col-span-2 text-center">Resources</div>
            <div className="col-span-1" />
          </div>
          {tags.map((tag, i) => (
            <div key={tag.id} className="grid grid-cols-12 gap-3 px-5 py-3 items-center text-sm"
              style={{ borderTop: i === 0 ? 'none' : '1px solid #f1f5f9' }}>
              <div className="col-span-5">
                <span className="inline-flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full"
                  style={{ backgroundColor: '#dbeafe', color: '#1d4ed8' }}>
                  #{tag.name}
                </span>
              </div>
              <div className="col-span-4 text-xs font-mono" style={{ color: '#94a3b8' }}>{tag.slug}</div>
              <div className="col-span-2 text-center" style={{ color: '#475569' }}>{tag._count.resources}</div>
              <div className="col-span-1 flex justify-end">
                <button onClick={() => handleDelete(tag.id, tag.name)} disabled={acting === tag.id}
                  className="text-xs px-2.5 py-1 rounded-lg font-medium disabled:opacity-50"
                  style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
                  {acting === tag.id ? '…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}