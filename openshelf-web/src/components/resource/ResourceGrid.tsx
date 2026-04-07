import { serverApi } from '@/lib/server-api'
import { ResourceCard } from './ResourceCard'
import { Resource } from '@/types'

interface Props {
    searchParams: Promise<{
        type?: string
        language?: string
        search?: string
        page?: string
    }>
}

export async function ResourceGrid({ searchParams }: Props) {
    const params = await searchParams

    const result = await serverApi.resources.list({
        type: params.type,
        language: params.language,
        search: params.search,
        page: params.page || 1,
        limit: 20,
    })

    if (result.data.length === 0) {
        return (
            <div
                className="flex flex-col items-center justify-center py-20 text-center"
                style={{ color: 'hsl(var(--muted-foreground))' }}
            >
                <p className="text-lg font-medium mb-1">No resources found</p>
                <p className="text-sm">Try adjusting your filters or search term.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Result count */}
            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {result.meta.total} result{result.meta.total !== 1 ? 's' : ''}
            </p>

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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

    return (
        <div className="flex items-center justify-center gap-2 pt-4">
            {currentPage > 1 && (

                <a href={buildPageUrl(currentPage - 1)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-blue-50 hover:text-blue-600"
                    style={{
                        border: '1px solid hsl(var(--border))',
                        color: 'hsl(var(--foreground))',
                    }}
                >
                    Previous
                </a>
            )}

            <span
                className="text-sm"
                style={{ color: 'hsl(var(--muted-foreground))' }}
            >
                Page {currentPage} of {totalPages}
            </span>

            {currentPage < totalPages && (

                <a href={buildPageUrl(currentPage + 1)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-blue-50 hover:text-blue-600"
                    style={{
                        border: '1px solid hsl(var(--border))',
                        color: 'hsl(var(--foreground))',
                    }}
                >
                    Next
                </a>
            )}
        </div>
    )
}