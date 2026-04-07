import Link from 'next/link'
import { Resource } from '@/types'

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

export function ResourceCard({ resource }: { resource: Resource }) {
  const colour = TYPE_COLOURS[resource.type]

  return (
    <Link
      href={`/resources/${resource.slug}`}
      className="group flex flex-col rounded-xl overflow-hidden transition-all hover:-translate-y-0.5"
      style={{
        border: '1px solid hsl(var(--border))',
        backgroundColor: 'hsl(var(--background))',
      }}
    >
      {/* Thumbnail / placeholder */}
      <div
        className="flex items-center justify-center text-4xl"
        style={{
          aspectRatio: '3/2',
          backgroundColor: 'hsl(var(--muted))',
        }}
      >
        {resource.thumbnailUrl ? (
          <img
            src={resource.thumbnailUrl}
            alt={resource.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span style={{ fontSize: 40 }}>{ICONS[resource.type]}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1.5 p-3 flex-1">
        {/* Type badge */}
        <span
          className="self-start text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ backgroundColor: colour.bg, color: colour.text }}
        >
          {TYPE_LABELS[resource.type]}
        </span>

        {/* Title */}
        <h3
          className="font-medium text-sm leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors"
          style={{ color: 'hsl(var(--foreground))' }}
        >
          {resource.title}
        </h3>

        {/* Author */}
        {resource.author && (
          <p
            className="text-xs line-clamp-1"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            {resource.author}
          </p>
        )}

        {/* Footer */}
        <div
          className="mt-auto pt-2 flex items-center justify-between text-xs"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          <span className="uppercase">{resource.language}</span>
          {resource._count && (
            <span>{resource._count.reviews} reviews</span>
          )}
        </div>
      </div>
    </Link>
  )
}