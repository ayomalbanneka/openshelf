'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Resource } from '@/types'
import {
  BookOpen,
  GraduationCap,
  ClipboardList,
  FileText,
  Headphones,
  type LucideIcon,
} from 'lucide-react'

const TYPE_LABELS: Record<string, string> = {
  BOOK: 'Book',
  COURSE: 'Course',
  EXAM_PAPER: 'Exam',
  DOCUMENT: 'Doc',
  AUDIO: 'Audio',
}

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  BOOK: { bg: '#DBEAFE', text: '#1E40AF' },
  COURSE: { bg: '#EDE9FE', text: '#5B21B6' },
  EXAM_PAPER: { bg: '#FEF3C7', text: '#92400E' },
  DOCUMENT: { bg: '#CCFBF1', text: '#0F766E' },
  AUDIO: { bg: '#FCE7F3', text: '#9D174D' },
}

const COVER_COLORS: Record<string, string> = {
  BOOK: '#1e3a5f',
  COURSE: '#2d1b69',
  EXAM_PAPER: '#7c2d12',
  DOCUMENT: '#064e3b',
  AUDIO: '#701a75',
}

const TYPE_ICONS: Record<string, LucideIcon> = {
  BOOK: BookOpen,
  COURSE: GraduationCap,
  EXAM_PAPER: ClipboardList,
  DOCUMENT: FileText,
  AUDIO: Headphones,
}

export function ResourceCard({ resource }: { resource: Resource }) {
  const router = useRouter()
  const color = TYPE_COLORS[resource.type]
  const coverBg = COVER_COLORS[resource.type] || '#1e3a5f'

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/resources/${resource.slug}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          router.push(`/resources/${resource.slug}`)
        }
      }}
      className="group flex flex-col rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
      style={{
        border: '1px solid hsl(var(--border))',
        backgroundColor: 'hsl(var(--background))',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      {/* Cover */}
      <div
        className="relative flex items-center justify-center overflow-hidden"
        style={{ aspectRatio: '3/4', backgroundColor: coverBg }}
      >
        {resource.thumbnailUrl ? (
          <img
            src={resource.thumbnailUrl}
            alt={resource.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 p-4 text-center">
            {(() => {
              const Icon = TYPE_ICONS[resource.type] || FileText
              return <Icon className="w-9 h-9 text-white/80" />
            })()}
            <p className="text-xs font-medium leading-snug line-clamp-3 text-white/80 px-2">
              {resource.title}
            </p>
          </div>
        )}

        {/* Type badge overlay */}
        <span
          className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
          style={{ backgroundColor: color.bg, color: color.text }}
        >
          {TYPE_LABELS[resource.type]}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 p-3">
        <h3
          className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors"
          style={{ color: 'hsl(var(--foreground))' }}
        >
          {resource.title}
        </h3>

        {resource.author && (
          <p className="text-xs line-clamp-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {resource.author}
          </p>
        )}

        <div
          className="flex items-center justify-between text-[11px] mt-1 pt-1"
          style={{
            color: 'hsl(var(--muted-foreground))',
            borderTop: '1px solid hsl(var(--border))',
          }}
        >
          <span className="uppercase font-medium">{resource.language}</span>
          {resource._count && (
            <span>{resource._count.reviews} reviews</span>
          )}
        </div>

        {/* Uploader */}
        {resource.uploadedBy && (
          <Link
            href={`/users/${resource.uploadedBy.id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs mt-1 hover:text-blue-600 transition-colors truncate block"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            {resource.uploadedBy.name}
          </Link>
        )}
      </div>
    </div>
  )
}