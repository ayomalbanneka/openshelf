'use client'
import { useRouter, usePathname } from 'next/navigation'

interface Category {
  id: string
  name: string
  slug: string
}

interface Props {
  categories: Category[]
  activeCategory: string
  searchParams: Record<string, string | undefined>
}

export function CategoryChips({ categories, activeCategory, searchParams }: Props) {
  const router   = useRouter()
  const pathname = usePathname()

  const setCategory = (slug: string) => {
    const params = new URLSearchParams(searchParams as Record<string, string>)
    if (slug) params.set('category', slug)
    else params.delete('category')
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="relative">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-4 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, hsl(var(--background)), transparent)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-4 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, hsl(var(--background)), transparent)' }} />

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>

        {/* All chip */}
        <button
          onClick={() => setCategory('')}
          className="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap"
          style={
            activeCategory === ''
              ? { backgroundColor: '#2563eb', color: '#fff' }
              : {
                  border: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--muted-foreground))',
                  backgroundColor: 'hsl(var(--background))',
                }
          }
        >
          All categories
        </button>

        {categories.map((c) => {
          const active = activeCategory === c.slug
          return (
            <button
              key={c.id}
              onClick={() => setCategory(c.slug)}
              className="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap"
              style={
                active
                  ? { backgroundColor: '#2563eb', color: '#fff' }
                  : {
                      border: '1px solid hsl(var(--border))',
                      color: 'hsl(var(--muted-foreground))',
                      backgroundColor: 'hsl(var(--background))',
                    }
              }
            >
              {c.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}