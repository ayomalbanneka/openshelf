'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { ResourceCard } from '@/components/resource/ResourceCard'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LibraryBig, Lock } from 'lucide-react'
import type { Resource } from '@/types'
import { toast } from '@/lib/toast'
toast.error('Failed to delete list')

interface ListItem {
  id: string
  note?: string
  sortOrder: number
  resource: {
    id: string
    title: string
    slug: string
    type: string
    thumbnailUrl?: string
    author?: string
    language: string
    _count: { reviews: number }
  }
}

interface ReadingList {
  id: string
  title: string
  description?: string
  isPublic: boolean
  userId: string
  user: { id: string; name: string }
  items: ListItem[]
  _count: { items: number }
}

export function ListDetail({ listId }: { listId: string }) {
  const { user } = useAuthStore()
  const [list, setList]           = useState<ReadingList | null>(null)
  const [loading, setLoading]     = useState(true)
  const [notFound_, setNotFound]  = useState(false)
  const [forbidden, setForbidden] = useState(false)

  useEffect(() => {
    api.lists.getOne(listId)
      .then(setList)
      .catch((err) => {
        if (err?.response?.status === 403) setForbidden(true)
        else setNotFound(true)
      })
      .finally(() => setLoading(false))
  }, [listId])

  const handleRemoveItem = async (itemId: string) => {
    if (!list) return
    try {
      await api.lists.removeItem(list.id, itemId)
      setList((prev) => prev ? { ...prev, items: prev.items.filter((i) => i.id !== itemId) } : prev)
    } catch {
      toast.error('Failed to remove item')
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="h-28 rounded-2xl animate-pulse mb-8" style={{ backgroundColor: 'hsl(var(--muted))' }} />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="rounded-xl animate-pulse" style={{ aspectRatio: '2/3', backgroundColor: 'hsl(var(--muted))' }} />
          ))}
        </div>
      </div>
    )
  }

  if (forbidden) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <Lock className="w-12 h-12 mb-4" />
        <h2 className="text-xl font-bold mb-2">This list is private</h2>
        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Only the owner can view this reading list.
        </p>
      </div>
    )
  }

  if (notFound_ || !list) return notFound()

  const isOwner = user?.id === list.userId

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">

      {/* Header */}
      <div
        className="rounded-2xl p-6 mb-8"
        style={{
          border: '1px solid hsl(var(--border))',
          backgroundColor: 'hsl(var(--background))',
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold">{list.title}</h1>
              {!list.isPublic && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
                >
                  Private
                </span>
              )}
            </div>
            {list.description && (
              <p className="text-sm mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {list.description}
              </p>
            )}
            <div className="flex items-center gap-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              <span>
                {list._count.items} {list._count.items === 1 ? 'item' : 'items'}
              </span>
              <span>·</span>
              <span>
                by{' '}
                <Link href={`/user/${list.user.id}`} className="hover:text-blue-600 transition-colors">
                  {list.user.name}
                </Link>
              </span>
            </div>
          </div>

          {isOwner && (
            <Link
              href="/lists"
              className="text-sm px-4 py-2 rounded-xl transition-colors shrink-0"
              style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            >
              All my lists
            </Link>
          )}
        </div>
      </div>

      {/* Items */}
      {list.items.length === 0 ? (
        <div
          className="text-center py-20 rounded-2xl"
          style={{ border: '2px dashed hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
        >
          <LibraryBig className="w-10 h-10 mb-3" />
          <p className="font-medium mb-1">This list is empty</p>
          {isOwner && (
            <p className="text-sm">
              Add resources from the{' '}
              <Link href="/browse" className="text-blue-600 hover:underline">browse page</Link>.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {list.items.map((item) => (
            <div key={item.id} className="relative group">
              <ResourceCard resource={item.resource as Resource} />
              {isOwner && (
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="absolute top-2 right-2 h-6 w-6 rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white shadow-sm"
                  style={{ backgroundColor: '#ef4444' }}
                  title="Remove from list"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}