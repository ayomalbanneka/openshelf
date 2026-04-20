'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export function SearchBar() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const inputRef     = useRef<HTMLInputElement>(null)
  const timerRef     = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const [value, setValue] = useState(searchParams.get('q') || '')
  const [focused, setFocused] = useState(false)

  // Keep input in sync when URL changes (e.g. back/forward)
  useEffect(() => {
    setValue(searchParams.get('q') || '')
  }, [searchParams])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setValue(q)

    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (q.trim().length >= 2) {
        router.push(`/search?q=${encodeURIComponent(q.trim())}`)
      } else if (q.trim().length === 0) {
        router.push('/search')
      }
    }, 400)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim().length >= 2) {
      clearTimeout(timerRef.current)
      router.push(`/search?q=${encodeURIComponent(value.trim())}`)
      inputRef.current?.blur()
    }
    if (e.key === 'Escape') {
      inputRef.current?.blur()
      setFocused(false)
    }
  }

  return (
    <div className="relative flex-1 max-w-sm">
      <div
        className="flex items-center gap-2 h-9 rounded-lg px-3 transition-all"
        style={{
          border: `1px solid ${focused ? '#2563eb' : 'hsl(var(--border))'}`,
          backgroundColor: 'hsl(var(--background))',
        }}
      >
        {/* Search icon */}
        <svg
          width="14"
          height="14"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          style={{ color: 'hsl(var(--muted-foreground))', flexShrink: 0 }}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" strokeLinecap="round" />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search resources…"
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: 'hsl(var(--foreground))' }}
        />

        {/* Clear button */}
        {value && (
          <button
            onMouseDown={(e) => {
              e.preventDefault()
              setValue('')
              router.push('/search')
            }}
            style={{ color: 'hsl(var(--muted-foreground))' }}
            className="text-xs hover:opacity-70 transition-opacity"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}