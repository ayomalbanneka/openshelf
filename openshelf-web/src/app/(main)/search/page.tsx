import { Suspense } from 'react';
import { serverApi } from '@/lib/server-api';
import { SearchResultCard } from '@/components/search/SearchResultCard';
import { SearchFilters } from '@/components/search/SearchFilters';
import { Frown, Search } from 'lucide-react';
import type { Metadata } from 'next';

type SearchHit = Parameters<typeof SearchResultCard>[0]['hit'];

interface Props {
  searchParams: Promise<{
    q?: string;
    type?: string;
    language?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `"${q}" — Search` : 'Search',
  };
}

// ── Results component ─────────────────────────────────────────
async function SearchResults({ searchParams }: Props) {
  const { q, type, language, page } = await searchParams;

  // Empty state — no query
  if (!q || q.trim().length < 2) {
    return (
      <div
        className="flex flex-col items-center justify-center py-24 text-center rounded-2xl"
        style={{
          border: '2px dashed hsl(var(--border))',
          color: 'hsl(var(--muted-foreground))',
        }}
      >
        <Search className="w-10 h-10 mb-4" />
        <p className="text-lg font-medium mb-1">What are you looking for?</p>
        <p className="text-sm">Search across books, courses, exam papers, documents and audio.</p>
      </div>
    );
  }

  const result = await serverApi.resources.search({
    q,
    type,
    language,
    page: page || 1,
    limit: 20,
  });

  // No results
  if (result.data.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-24 text-center rounded-2xl"
        style={{
          border: '2px dashed hsl(var(--border))',
          color: 'hsl(var(--muted-foreground))',
        }}
      >
        <Frown className="w-10 h-10 mb-4" />
        <p className="text-lg font-medium mb-1">No results for &ldquo;{q}&rdquo;</p>
        <p className="text-sm">Try different keywords, check your spelling, or remove filters.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Result count + timing */}
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {result.meta.total.toLocaleString()} result
          {result.meta.total !== 1 ? 's' : ''} for{' '}
          <span className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>
            &ldquo;{q}&rdquo;
          </span>
          {result.meta.processingMs !== undefined && (
            <span className="ml-2 text-xs">({result.meta.processingMs}ms)</span>
          )}
        </p>
      </div>

      {/* Result list */}
      <div className="flex flex-col gap-3">
        {(result.data as SearchHit[]).map((hit) => (
          <SearchResultCard key={hit.id} hit={hit} />
        ))}
      </div>

      {/* Pagination */}
      {result.meta.pages > 1 && (
        <SearchPagination
          currentPage={Number(page) || 1}
          totalPages={result.meta.pages}
          q={q}
          type={type}
          language={language}
        />
      )}
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────
function SearchPagination({
  currentPage,
  totalPages,
  q,
  type,
  language,
}: {
  currentPage: number;
  totalPages: number;
  q?: string;
  type?: string;
  language?: string;
}) {
  const buildUrl = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (type) params.set('type', type);
    if (language) params.set('language', language);
    params.set('page', String(p));
    return `/search?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      {currentPage > 1 && (
        <a
          href={buildUrl(currentPage - 1)}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            border: '1px solid hsl(var(--border))',
            color: 'hsl(var(--foreground))',
          }}
        >
          Previous
        </a>
      )}
      <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
        Page {currentPage} of {totalPages}
      </span>
      {currentPage < totalPages && (
        <a
          href={buildUrl(currentPage + 1)}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            border: '1px solid hsl(var(--border))',
            color: 'hsl(var(--foreground))',
          }}
        >
          Next
        </a>
      )}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────
function SearchSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-28 rounded-xl animate-pulse"
          style={{ backgroundColor: 'hsl(var(--muted))' }}
        />
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const { q, type, language } = params;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Search</h1>
        <p style={{ color: 'hsl(var(--muted-foreground))' }}>
          Powered by Meilisearch — typo-tolerant, instant results.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar filters */}
        <aside className="lg:w-52 shrink-0">
          <SearchFilters q={q || ''} type={type} language={language} />
        </aside>

        {/* Results */}
        <section className="flex-1 min-w-0">
          <Suspense fallback={<SearchSkeleton />}>
            <SearchResults searchParams={searchParams} />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
