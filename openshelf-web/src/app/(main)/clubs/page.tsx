import { Suspense } from 'react'
import { serverApi } from '@/lib/server-api'
import { ClubCard } from '@/components/clubs/ClubCard'
import { CreateClubButton } from '@/components/clubs/CreateClubButton'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Reading clubs' }

async function ClubsList() {
  const result = await serverApi.clubs.list()

  if (result.data.length === 0) {
    return (
      <div
        className="text-center py-20 rounded-2xl"
        style={{
          border: '2px dashed hsl(var(--border))',
          color: 'hsl(var(--muted-foreground))',
        }}
      >
        <p className="text-lg font-medium mb-1">No clubs yet</p>
        <p className="text-sm">Be the first to start one.</p>
      </div>
    )
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {result.data.map((club: any) => (
        <ClubCard key={club.id} club={club} />
      ))}
    </div>
  )
}

function ClubsSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="h-40 rounded-xl animate-pulse"
          style={{ backgroundColor: 'hsl(var(--muted))' }}
        />
      ))}
    </div>
  )
}

export default function ClubsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Reading clubs</h1>
          <p style={{ color: 'hsl(var(--muted-foreground))' }}>
            Join a club, discuss books, and meet readers from around the world.
          </p>
        </div>
        <CreateClubButton />
      </div>

      <Suspense fallback={<ClubsSkeleton />}>
        <ClubsList />
      </Suspense>
    </div>
  )
}