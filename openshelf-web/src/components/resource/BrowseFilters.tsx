'use client'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { serverApi } from '@/lib/server-api'
import {
  LayoutGrid,
  BookOpen,
  GraduationCap,
  ClipboardList,
  FileText,
  Headphones,
} from 'lucide-react'

const TYPES = [
  { value: '',           label: 'All',          icon: LayoutGrid },
  { value: 'BOOK',       label: 'Books',         icon: BookOpen },
  { value: 'COURSE',     label: 'Courses',       icon: GraduationCap },
  { value: 'EXAM_PAPER', label: 'Exam papers',   icon: ClipboardList },
  { value: 'DOCUMENT',   label: 'Documents',     icon: FileText },
  { value: 'AUDIO',      label: 'Audio',         icon: Headphones },
]

const LANGUAGES = [
  { value: '', label: 'All languages' },
  { value: 'en', label: 'English' },
  { value: 'si', label: 'Sinhala' },
  { value: 'ta', label: 'Tamil' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'es', label: 'Spanish' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ar', label: 'Arabic' },
]

interface Category {
  id: string
  name: string
  slug: string
}

interface Props {
  searchParams: {
    type?: string
    language?: string
    search?: string
    category?: string
  }
}

export function BrowseFilters({ searchParams }: Props) {
  const router   = useRouter()
  const pathname = usePathname()
  const [categories, setCategories] = useState<Category[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    serverApi.categories.list()
      .then(setCategories)
      .catch(() => {})
  }, [])

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams as Record<string, string>)
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setParam('search', e.target.value), 350)
  }

  const activeType     = searchParams.type     || ''
  const activeLanguage = searchParams.language || ''
  const activeCategory = searchParams.category || ''

  const sectionLabel = "text-[10px] font-bold uppercase tracking-[0.12em] mb-2 block"
  const labelColor   = { color: 'hsl(var(--muted-foreground))' }

  return (
    <div className="flex flex-col gap-7">

      {/* Search */}
      <div>
        <span className={sectionLabel} style={labelColor}>Search</span>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
            style={{ color: 'hsl(var(--muted-foreground))' }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            defaultValue={searchParams.search}
            placeholder="Title, author…"
            onChange={handleSearch}
            className="h-9 w-full rounded-lg pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            style={{
              border: '1px solid hsl(var(--border))',
              backgroundColor: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
            }}
          />
        </div>
      </div>

      {/* Type filter — icon pills */}
      <div>
        <span className={sectionLabel} style={labelColor}>Type</span>
        <div className="flex flex-col gap-1">
          {TYPES.map((t) => {
            const active = activeType === t.value
            return (
              <button
                key={t.value}
                onClick={() => setParam('type', t.value)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-all"
                style={
                  active
                    ? { backgroundColor: '#2563eb', color: '#fff' }
                    : { color: 'hsl(var(--foreground))' }
                }
              >
                <t.icon className="w-4 h-4" />
                <span className={active ? 'font-medium' : ''}>{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div>
          <span className={sectionLabel} style={labelColor}>Category</span>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setParam('category', '')}
              className="text-left text-sm px-3 py-2 rounded-lg transition-all"
              style={
                activeCategory === ''
                  ? { backgroundColor: 'hsl(var(--muted))', fontWeight: 500, color: 'hsl(var(--foreground))' }
                  : { color: 'hsl(var(--muted-foreground))' }
              }
            >
              All categories
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setParam('category', c.slug)}
                className="text-left text-sm px-3 py-2 rounded-lg transition-all truncate"
                style={
                  activeCategory === c.slug
                    ? { backgroundColor: 'hsl(var(--muted))', fontWeight: 500, color: 'hsl(var(--foreground))' }
                    : { color: 'hsl(var(--muted-foreground))' }
                }
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Language filter */}
      <div>
        <span className={sectionLabel} style={labelColor}>Language</span>
        <div className="flex flex-col gap-1">
          {LANGUAGES.map((l) => {
            const active = activeLanguage === l.value
            return (
              <button
                key={l.value}
                onClick={() => setParam('language', l.value)}
                className="text-left text-sm px-3 py-2 rounded-lg transition-all"
                style={
                  active
                    ? { backgroundColor: 'hsl(var(--muted))', fontWeight: 500, color: 'hsl(var(--foreground))' }
                    : { color: 'hsl(var(--muted-foreground))' }
                }
              >
                {l.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Clear all */}
      {(activeType || activeLanguage || activeCategory || searchParams.search) && (
        <button
          onClick={() => router.push(pathname)}
          className="text-xs font-medium text-blue-600 hover:underline text-left"
        >
          Clear all filters
        </button>
      )}
    </div>
  )
}