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

export function ClubCard({ club }: { club: Club }) {
  return (
    <Link
      href={`/clubs/${club.slug}`}
      className="flex flex-col gap-3 p-5 rounded-xl transition-all hover:-translate-y-0.5"
      style={{
        border: '1px solid hsl(var(--border))',
        backgroundColor: 'hsl(var(--background))',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold leading-snug">{club.name}</h3>
        {!club.isPublic && (
          <span
            className="text-xs px-2 py-0.5 rounded-full shrink-0"
            style={{
              backgroundColor: 'hsl(var(--muted))',
              color: 'hsl(var(--muted-foreground))',
            }}
          >
            Private
          </span>
        )}
      </div>

      {club.description && (
        <p
          className="text-sm line-clamp-2"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          {club.description}
        </p>
      )}

      <div
        className="mt-auto flex items-center gap-3 text-xs"
        style={{ color: 'hsl(var(--muted-foreground))' }}
      >
        <span>{club._count.members} members</span>
        <span>·</span>
        <span>{club._count.discussions} discussions</span>
        <span>·</span>
        <span>by {club.createdBy.name}</span>
      </div>
    </Link>
  )
}