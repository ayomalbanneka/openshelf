'use client'
import { useState, useEffect, useRef } from 'react'
import { BookOpen, CheckCircle } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'
import type { Resource } from '@/types'

interface Progress {
  id: string
  currentPage: number
  totalPages?: number
  percentage: number
  isCompleted: boolean
  lastReadAt: string
}

interface Props {
  resource: Resource
}

export function ReadingProgress({ resource }: Props) {
  const { user }    = useAuthStore()
  const [progress, setProgress]   = useState<Progress | null>(null)
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages]   = useState(resource.pageCount || 0)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalTime, setTotalTime]     = useState(resource.duration || 0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isPageBased = ['BOOK', 'DOCUMENT', 'EXAM_PAPER', 'COURSE'].includes(resource.type)
  const isTimeBased = resource.type === 'AUDIO'

  // Load existing progress
  useEffect(() => {
    if (!user) { setLoading(false); return }
    api.progress.get(resource.id)
      .then((data) => {
        if (data) {
          setProgress(data)
          setCurrentPage(data.currentPage || 0)
          setTotalPages(data.totalPages || resource.pageCount || 0)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user, resource.id])

  // Auto-save with debounce
  const saveProgress = (page?: number, time?: number) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSaving(true)
      try {
        const payload: Record<string, number> = {}
        if (isPageBased) {
          payload.currentPage = page ?? currentPage
          payload.totalPages  = totalPages
        }
        if (isTimeBased) {
          payload.currentTime = time ?? currentTime
          payload.totalTime   = totalTime
        }

        const updated = await api.progress.update(resource.id, payload)
        setProgress(updated)

        if (updated.isCompleted && !progress?.isCompleted) {
          toast.success('Marked as complete!')
        }
      } catch {
        // silent fail — progress saving is non-critical
      } finally {
        setSaving(false)
      }
    }, 800)
  }

  const handleMarkComplete = async () => {
    setSaving(true)
    try {
      const payload = isPageBased
        ? { currentPage: totalPages, totalPages }
        : { currentTime: totalTime, totalTime }
      const updated = await api.progress.update(resource.id, payload)
      setProgress(updated)
      if (isPageBased) setCurrentPage(totalPages)
      if (isTimeBased) setCurrentTime(totalTime)
      toast.success('Marked as complete!')
    } catch {
      toast.error('Failed to update progress')
    } finally {
      setSaving(false)
    }
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}h ${m}m`
    return `${m}m ${s}s`
  }

  if (!user) return null
  if (loading) return (
    <div
      className="h-24 rounded-2xl animate-pulse"
      style={{ backgroundColor: 'hsl(var(--muted))' }}
    />
  )

  const pct = progress?.percentage ?? 0
  const completed = progress?.isCompleted ?? pct >= 100

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{
        border: `1px solid ${completed ? 'hsl(var(--success-border))' : 'hsl(var(--border))'}`,
        backgroundColor: completed ? 'hsl(var(--success-bg))' : 'hsl(var(--background))',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span aria-hidden style={{ display: 'inline-flex' }}>
            {completed ? (
              <CheckCircle size={18} style={{ color: 'hsl(var(--success))' }} />
            ) : (
              <BookOpen size={18} style={{ color: 'hsl(var(--ring))' }} />
            )}
          </span>
          <p className="text-sm font-semibold">
            {completed ? 'Completed!' : 'Your progress'}
          </p>
          {saving && (
            <span
              className="text-xs"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              Saving…
            </span>
          )}
        </div>
        {progress?.lastReadAt && (
          <p
            className="text-xs"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            Last read{' '}
            {new Date(progress.lastReadAt).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric',
            })}
          </p>
        )}
      </div>

      {/* Progress bar */}
      <div>
        <div
          className="w-full rounded-full h-2 overflow-hidden"
          style={{ backgroundColor: 'hsl(var(--muted))' }}
        >
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              backgroundColor: completed ? 'hsl(var(--success))' : 'hsl(var(--ring))',
            }}
          />
        </div>
        <p
          className="text-xs mt-1 text-right"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          {Math.round(pct)}% complete
        </p>
      </div>

      {/* Page-based tracker */}
      {isPageBased && !completed && (
        <div className="flex items-center gap-3">
          <p className="text-sm shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Page
          </p>
          <input
            type="number"
            min={0}
            max={totalPages || undefined}
            value={currentPage || ''}
            onChange={(e) => {
              const val = Number(e.target.value)
              setCurrentPage(val)
              saveProgress(val)
            }}
            placeholder="0"
            className="w-20 h-9 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-center"
            style={{
              border: '1px solid hsl(var(--border))',
              backgroundColor: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
            }}
          />
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            of
          </p>
          <input
            type="number"
            min={1}
            value={totalPages || ''}
            onChange={(e) => {
              const val = Number(e.target.value)
              setTotalPages(val)
              saveProgress(undefined)
            }}
            placeholder={resource.pageCount ? String(resource.pageCount) : 'total'}
            className="w-20 h-9 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-center"
            style={{
              border: '1px solid hsl(var(--border))',
              backgroundColor: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
            }}
          />
          <p className="text-sm shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }}>
            pages
          </p>
        </div>
      )}

      {/* Time-based tracker (audio) */}
      {isTimeBased && !completed && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs"
            style={{ color: 'hsl(var(--muted-foreground))' }}>
            <span>{formatTime(currentTime)}</span>
            <span>{totalTime ? formatTime(totalTime) : 'unknown duration'}</span>
          </div>
          <input
            type="range"
            min={0}
            max={totalTime || 100}
            value={currentTime}
            onChange={(e) => {
              const val = Number(e.target.value)
              setCurrentTime(val)
              saveProgress(undefined, val)
            }}
            className="w-full accent-blue-600"
          />
          {!resource.duration && (
            <div className="flex items-center gap-2">
              <p className="text-xs shrink-0"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
                Total duration (seconds):
              </p>
              <input
                type="number"
                min={1}
                value={totalTime || ''}
                onChange={(e) => setTotalTime(Number(e.target.value))}
                placeholder="e.g. 3600"
                className="w-24 h-8 rounded-lg px-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  border: '1px solid hsl(var(--border))',
                  backgroundColor: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Mark complete / reset */}
      <div className="flex gap-2">
        {!completed ? (
          <button
            onClick={handleMarkComplete}
            disabled={saving}
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
            style={{
              backgroundColor: 'hsl(var(--ring))',
              color: '#fff',
            }}
          >
            Mark as complete
          </button>
        ) : (
          <button
            onClick={async () => {
              setSaving(true)
              try {
                const updated = await api.progress.update(resource.id, {
                  currentPage: 0,
                  totalPages,
                })
                setProgress(updated)
                setCurrentPage(0)
                toast.info('Progress reset')
              } catch {
                toast.error('Failed to reset progress')
              } finally {
                setSaving(false)
              }
            }}
            disabled={saving}
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
            style={{
              border: '1px solid hsl(var(--border))',
              color: 'hsl(var(--muted-foreground))',
            }}
          >
            Reset progress
          </button>
        )}
      </div>
    </div>
  )
}