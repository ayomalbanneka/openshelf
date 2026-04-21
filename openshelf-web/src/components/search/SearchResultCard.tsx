import Link from 'next/link'

const TYPE_LABELS: Record<string, string> = {
  BOOK:       'Book',
  COURSE:     'Course',
  EXAM_PAPER: 'Exam paper',
  DOCUMENT:   'Document',
  AUDIO:      'Audio',
}

const TYPE_COLOURS: Record<string, { bg: string; text: string }> = {
  BOOK:       { bg: '#DBEAFE', text: '#1E40AF' },
  COURSE:     { bg: '#EDE9FE', text: '#5B21B6' },
  EXAM_PAPER: { bg: '#FEF3C7', text: '#92400E' },
  DOCUMENT:   { bg: '#CCFBF1', text: '#0F766E' },
  AUDIO:      { bg: '#FCE7F3', text: '#9D174D' },
}

const ICONS: Record<string, string> = {
  BOOK:       '📖',
  COURSE:     '🎓',
  EXAM_PAPER: '📝',
  DOCUMENT:   '📄',
  AUDIO:      '🎧',
}

interface SearchHit {
  id: string
  title: string
  slug: string
  description?: string
  type: string
  language: string
  author?: string
  thumbnailUrl?: string
  pageCount?: number
  publicationYear?: number
  viewCount: number
  categoryName?: string
  categorySlug?: string
  tags?: string[]
  _formatted?: {
    title?: string
    author?: string
    description?: string
  }
}

export function SearchResultCard({ hit }: { hit: SearchHit }) {
  const colour = TYPE_COLOURS[hit.type] || TYPE_COLOURS.DOCUMENT

  const highlightedTitle  = hit._formatted?.title       || hit.title
  const highlightedAuthor = hit._formatted?.author      || hit.author
  const highlightedDesc   = hit._formatted?.description || hit.description

  return (
    <Link
      href={`/resources/${hit.slug}`}
      className="flex gap-4 p-4 rounded-xl transition-all hover:-translate-y-0.5 group"
      style={{
        border: '1px solid hsl(var(--border))',
        backgroundColor: 'hsl(var(--background))',
      }}
    >
      {/* Thumbnail */}
      <div
        className="h-20 w-16 rounded-lg flex items-center justify-center shrink-0 text-2xl"
        style={{ backgroundColor: 'hsl(var(--muted))' }}
      >
        {hit.thumbnailUrl ? (
          <img
            src={hit.thumbnailUrl}
            alt={hit.title}
            className="h-20 w-16 object-cover rounded-lg"
          />
        ) : (
          <span>{ICONS[hit.type] || '📄'}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
              style={{ backgroundColor: colour.bg, color: colour.text }}
            >
              {TYPE_LABELS[hit.type]}
            </span>
            <span
              className="text-xs uppercase shrink-0"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              {hit.language}
            </span>
          </div>
          <span
            className="text-xs shrink-0"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            {hit.viewCount.toLocaleString()} views
          </span>
        </div>

        {/* Title with highlight */}
        <h3
          className="font-semibold text-sm leading-snug group-hover:text-blue-600 transition-colors"
          dangerouslySetInnerHTML={{ __html: highlightedTitle }}
        />

        {/* Author with highlight */}
        {(highlightedAuthor || hit.author) && (
          <p
            className="text-xs"
            style={{ color: 'hsl(var(--muted-foreground))' }}
            dangerouslySetInnerHTML={{
              __html: highlightedAuthor
                ? `by ${highlightedAuthor}`
                : `by ${hit.author}`,
            }}
          />
        )}

        {/* Description with highlight */}
        {highlightedDesc && (
          <p
            className="text-xs line-clamp-2 mt-0.5"
            style={{ color: 'hsl(var(--muted-foreground))' }}
            dangerouslySetInnerHTML={{ __html: highlightedDesc }}
          />
        )}

        {/* Footer */}
        <div className="flex items-center gap-3 mt-auto pt-1">
          {hit.categoryName && (
            <span
              className="text-xs"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              {hit.categoryName}
            </span>
          )}
          {hit.tags && hit.tags.length > 0 && (
            <div className="flex gap-1">
              {hit.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: 'hsl(var(--muted))',
                    color: 'hsl(var(--muted-foreground))',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}