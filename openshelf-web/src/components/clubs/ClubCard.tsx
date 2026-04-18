import Link from 'next/link'

interface Club {
  id: string
  name: string
  slug: string
  description?: string
  isPublic: boolean
  createdBy: { id: string; name: string }
  _count: { members: number; discussions: number }
}

// Deterministic accent color per club name
const ACCENTS = ['#2563eb', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626']
const getAccent = (name: string) =>
  ACCENTS[name.charCodeAt(0) % ACCENTS.length]

export function ClubCard({ club }: { club: Club }) {
  const accent = getAccent(club.name)

  return (
    <Link
      href={`/clubs/${club.slug}`}
      className="group flex flex-col rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
      style={{
        border: '1px solid hsl(var(--border))',
        backgroundColor: 'hsl(var(--background))',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      {/* Color band */}
      <div className="h-1.5 w-full" style={{ backgroundColor: accent }} />

      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            {/* Avatar */}
            <div
              className="h-9 w-9 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0"
              style={{ backgroundColor: accent }}
            >
              {club.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3
                className="font-semibold leading-tight group-hover:text-blue-600 transition-colors"
                style={{ color: 'hsl(var(--foreground))' }}
              >
                {club.name}
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                by {club.createdBy.name}
              </p>
            </div>
          </div>

          {!club.isPublic && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 mt-0.5"
              style={{
                backgroundColor: 'hsl(var(--muted))',
                color: 'hsl(var(--muted-foreground))',
              }}
            >
              Private
            </span>
          )}
        </div>

        {/* Description */}
        {club.description && (
          <p
            className="text-sm line-clamp-2 leading-relaxed"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            {club.description}
          </p>
        )}

        {/* Stats */}
        <div
          className="mt-auto flex items-center gap-4 pt-3 text-xs"
          style={{
            borderTop: '1px solid hsl(var(--border))',
            color: 'hsl(var(--muted-foreground))',
          }}
        >
          <span className="flex items-center gap-1">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            {club._count.members} members
          </span>
          <span className="flex items-center gap-1">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            {club._count.discussions} discussions
          </span>
        </div>
      </div>
    </Link>
  )
}