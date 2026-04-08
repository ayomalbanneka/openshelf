import { Suspense } from 'react'
import { ResourceGrid } from '@/components/resource/ResourceGrid'
import { BrowseFilters } from '@/components/resource/BrowseFilters'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Browse' }

interface Props {
  searchParams: Promise<{
    type?: string
    language?: string
    search?: string
    page?: string
  }>
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl animate-pulse"
          style={{
            aspectRatio: '3/4',
            backgroundColor: 'hsl(var(--muted))',
          }}
        />
      ))}
    </div>
  )
}

export default async function BrowsePage({ searchParams }: Props) {
    const params = await searchParams

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Browse the library</h1>
        <p style={{ color: 'hsl(var(--muted-foreground))' }}>
          Discover books, courses, exam papers and documents from around the world.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* Sidebar */}
        <aside className="lg:w-52 shrink-0">
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