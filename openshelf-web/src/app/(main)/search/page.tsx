import { Suspense } from 'react'
import { serverApi } from '@/lib/server-api'
import { ResourceCard } from '@/components/resource/ResourceCard'
import { Resource } from '@/types'
import type { Metadata } from 'next'

interface Props {
  searchParams: Promise<{ q?: string; type?: string; language?: string; page?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams
  return { title: q ? `Search: ${q}` : 'Search' }
}

async function SearchResults({ searchParams }: Props) {
  const params = await searchParams
  const { q, type, language, page } = params

  if (!q || q.trim().length < 2) {
    return (
      <div
        className="text-center py-20"
        style={{ color: 'hsl(var(--muted-foreground))' }}
      >
        <p className="text-lg font-medium mb-1">Start searching</p>
        <p className="text-sm">Enter at least 2 characters to search.</p>
      </div>
    )
  }

  const result = await serverApi.resources.search({ q, type, language, page: page || 1, limit: 20 })

  if (result.data.length === 0) {
    return (
      <div
        className="text-center py-20"
        style={{ color: 'hsl(var(--muted-foreground))' }}
      >
        <p className="text-lg font-medium mb-1">No results for &ldquo;{q}&rdquo;</p>
        <p className="text-sm">Try different keywords or check your spelling.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
        {result.meta.total} result{result.meta.total !== 1 ? 's' : ''} for{' '}
        <span className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>
          &ldquo;{q}&rdquo;
        </span>
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {result.data.map((resource: Resource) => (
          <ResourceCard key={resource.id} resource={resource} />
        ))}
      </div>
    </div>
  )
}

function SearchSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl animate-pulse"
          style={{ aspectRatio: '3/4', backgroundColor: 'hsl(var(--muted))' }}
        />
      ))}
    </div>
  )
}

export default function SearchPage({ searchParams }: Props) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Search</h1>
        <p style={{ color: 'hsl(var(--muted-foreground))' }}>
          Search across books, courses, exam papers and more.
        </p>
      </div>

      <Suspense fallback={<SearchSkeleton />}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </div>
  )
}