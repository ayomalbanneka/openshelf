'use client'
import { cn } from '@/lib/utils'
import { useRouter, usePathname } from 'next/navigation'

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
  searchParams: {
    type?: string
    language?: string
    search?: string
  }
}

export function BrowseFilters({ searchParams }: Props) {
  const router   = useRouter()
  const pathname = usePathname()

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(
      searchParams as Record<string, string>
    )
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearTimeout((window as any)._searchTimer)
    ;(window as any)._searchTimer = setTimeout(() => {
      setParam('search', e.target.value)
    }, 400)
  }

  const activeType     = searchParams.type     || ''
  const activeLanguage = searchParams.language || ''

  return (
    <div className="flex flex-col gap-6">

      {/* Search */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'hsl(var(--muted-foreground))' }}>
          Search
        </p>
        <input
          type="text"
          defaultValue={searchParams.search}
          placeholder="Title, author…"
          onChange={handleSearch}
          className="h-9 w-full rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          style={{
            border: '1px solid hsl(var(--border))',
            backgroundColor: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
          }}
        />
      </div>

      {/* Type filter */}
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'hsl(var(--muted-foreground))' }}>
          Type
        </p>
        {TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setParam('type', t.value)}
            className={cn(
              'text-left text-sm px-3 py-1.5 rounded-lg transition-colors',
              activeType === t.value
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'hover:bg-gray-100'
            )}
            style={
              activeType !== t.value
                ? { color: 'hsl(var(--foreground))' }
                : undefined
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Language filter */}
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'hsl(var(--muted-foreground))' }}>
          Language
        </p>
        {LANGUAGES.map((l) => (
          <button
            key={l.value}
            onClick={() => setParam('language', l.value)}
            className={cn(
              'text-left text-sm px-3 py-1.5 rounded-lg transition-colors',
              activeLanguage === l.value
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'hover:bg-gray-100'
            )}
            style={
              activeLanguage !== l.value
                ? { color: 'hsl(var(--foreground))' }
                : undefined
            }
          >
            {l.label}
          </button>
        ))}
      </div>

    </div>
  )
}