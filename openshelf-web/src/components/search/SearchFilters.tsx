'use client'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const TYPES = [
  { value: '',           label: 'All types' },
  { value: 'BOOK',       label: 'Books' },
  { value: 'COURSE',     label: 'Courses' },
  { value: 'EXAM_PAPER', label: 'Exam papers' },
  { value: 'DOCUMENT',   label: 'Documents' },
  { value: 'AUDIO',      label: 'Audio' },
]

const LANGUAGES = [
  { value: '',   label: 'All languages' },
  { value: 'en', label: 'English' },
  { value: 'si', label: 'Sinhala' },
  { value: 'ta', label: 'Tamil' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'es', label: 'Spanish' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ar', label: 'Arabic' },
]

interface Props {
  q: string
  type?: string
  language?: string
}

export function SearchFilters({ q, type, language }: Props) {
  const router   = useRouter()
  const pathname = usePathname()

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (value) params.set(key, value)
    // Reset page when filter changes
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Type */}
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-2"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          Type
        </p>
        <div className="flex flex-col gap-1">
          {TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setParam('type', t.value)}
              className={cn(
                'text-left text-sm px-3 py-1.5 rounded-lg transition-colors',
                (type || '') === t.value
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'hover:bg-gray-100'
              )}
              style={
                (type || '') !== t.value
                  ? { color: 'hsl(var(--foreground))' }
                  : undefined
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-2"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          Language
        </p>
        <div className="flex flex-col gap-1">
          {LANGUAGES.map((l) => (
            <button
              key={l.value}
              onClick={() => setParam('language', l.value)}
              className={cn(
                'text-left text-sm px-3 py-1.5 rounded-lg transition-colors',
                (language || '') === l.value
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'hover:bg-gray-100'
              )}
              style={
                (language || '') !== l.value
                  ? { color: 'hsl(var(--foreground))' }
                  : undefined
              }
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}