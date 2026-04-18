import { serverApi } from '@/lib/server-api'
import { ResourceCard } from './ResourceCard'
import { Resource } from '@/types'

interface Props {
  searchParams: Promise<{
    type?: string
    language?: string
    search?: string
    category?: string
    page?: string
  }>
}

export async function ResourceGrid({ searchParams }: Props) {
  const params = await searchParams

  const result = await serverApi.resources.list({
    type:     params.type,
    language: params.language,
    search:   params.search,
    category: params.category,
    page:     params.page || 1,
    limit:    20,
  })

  if (result.data.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20 text-center rounded-2xl"
        style={{
          border: '2px dashed hsl(var(--border))',
          color: 'hsl(var(--muted-foreground))',
        }}
      >
        <div className="text-4xl mb-3">🔍</div>
        <p className="text-base font-medium mb-1">No resources found</p>
        <p className="text-sm">Try adjusting your filters or search term.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Result count */}
      <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
        {result.meta.total.toLocaleString()} result{result.meta.total !== 1 ? 's' : ''}
      </p>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {result.data.map((resource: Resource) => (
          <ResourceCard key={resource.id} resource={resource} />
        ))}
      </div>

      {/* Pagination */}
      {result.meta.pages > 1 && (
        <Pagination
          currentPage={result.meta.page}
          totalPages={result.meta.pages}
          searchParams={params}
        />
      )}
    </div>
  )
}

function Pagination({
  currentPage,
  totalPages,
  searchParams,
}: {
  currentPage: number
  totalPages: number
  searchParams: Record<string, string | undefined>
}) {
  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams()
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v && k !== 'page') params.set(k, v)
    })
    params.set('page', String(page))
    return `/browse?${params.toString()}`
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  const visible = pages.filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1
  )

  return (
    <div className="flex items-center justify-center gap-1.5 pt-6">
      {currentPage > 1 && (
        <a
          href={buildPageUrl(currentPage - 1)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Prev
        </a>
      )}

      {visible.map((page, i) => {
        const prev = visible[i - 1]
        const showEllipsis = prev && page - prev > 1
        return (
          <span key={page} className="flex items-center gap-1.5">
            {showEllipsis && (
              <span className="text-sm px-1" style={{ color: 'hsl(var(--muted-foreground))' }}>…</span>
            )}
            <a
              href={buildPageUrl(page)}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors"
              style={
                page === currentPage
                  ? { backgroundColor: '#2563eb', color: '#fff' }
                  : { border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }
              }
            >
              {page}
            </a>
          </span>
        )
      })}

      {currentPage < totalPages && (
        <a
          href={buildPageUrl(currentPage + 1)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
        >
          Next
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
      )}
    </div>
  )
}