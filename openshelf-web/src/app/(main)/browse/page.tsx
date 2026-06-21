import { Suspense } from 'react'
import { ResourceGrid } from '@/components/resource/ResourceGrid'
import { BrowseFilters } from '@/components/resource/BrowseFilters'
import { CategoryChips } from '@/components/resource/CategoryChips'
import { ContinueReading } from '@/components/resource/ContinueReading'
import { serverApi } from '@/lib/server-api'
import type { Metadata } from 'next'

type Props = { searchParams: Promise<{ q?: string; type?: string; category?: string }> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q, type, category } = await searchParams

  let title = 'Browse Resources'
  const parts: string[] = []
  if (q) parts.push(`"${q}"`)
  if (type) parts.push(type.toLowerCase())
  if (category) parts.push(category)
  if (parts.length) title = `Browse ${parts.join(', ')}`

  const description = q
    ? `Search results for "${q}" in the OpenShelf free library.`
    : 'Browse thousands of free books, research papers, audio recordings, and courses on OpenShelf.'

  return {
    title,
    description,
    // Don't index filtered/search result pages — prevents duplicate content
    robots: q || type || category
      ? { index: false, follow: true }
      : { index: true, follow: true },
  }
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: 15 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl animate-pulse"
          style={{ aspectRatio: '2/3', backgroundColor: 'hsl(var(--muted))' }}
        />
      ))}
    </div>
  )
}

export default async function BrowsePage({ searchParams }: Props) {
  const params = await searchParams
  const categoriesResult = await serverApi.categories.list().catch(() => [])
  const categories = Array.isArray(categoriesResult) ? categoriesResult : []

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-0.5">Browse the library</h1>
        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Discover books, courses, exam papers and documents from around the world.
        </p>
      </div>

      {/* Continue reading — only shows if user has in-progress items */}
      <ContinueReading />

      {/* Category chips row */}
      {categories.length > 0 && (
        <CategoryChips categories={categories} activeCategory={params.category || ''} searchParams={params} />
      )}

      <div className="flex flex-col lg:flex-row gap-8 mt-6">

        {/* Sidebar */}
        <aside className="lg:w-48 shrink-0">
          <BrowseFilters searchParams={params} />
        </aside>

        {/* Grid */}
        <section className="flex-1 min-w-0">
          <Suspense fallback={<GridSkeleton />}>
            <ResourceGrid searchParams={searchParams} />
          </Suspense>
        </section>

      </div>
    </div>
  )
}