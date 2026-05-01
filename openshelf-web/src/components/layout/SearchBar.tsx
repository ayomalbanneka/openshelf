'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'

export function SearchBar() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const inputRef     = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const [value, setValue]   = useState(searchParams.get('q') || '')
  const [focused, setFocused] = useState(false)

  // ⌘K / Ctrl+K focuses the search bar from anywhere
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

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
          placeholder="Search…"
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: 'hsl(var(--foreground))' }}
        />

        {/* Keyboard shortcut hint — hidden when focused or has value */}
        {!focused && !value && (
          <kbd
            className="hidden sm:flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded shrink-0"
            style={{
              backgroundColor: 'hsl(var(--muted))',
              color: 'hsl(var(--muted-foreground))',
              border: '1px solid hsl(var(--border))',
            }}
          >
            ⌘K
          </kbd>
        )}

        {/* Clear button */}
        {value && (
          <button
            onMouseDown={(e) => {
              e.preventDefault()
              setValue('')
              router.push('/search')
            }}
            aria-label="Clear search"
            className="text-xs hover:opacity-70 transition-opacity shrink-0"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}