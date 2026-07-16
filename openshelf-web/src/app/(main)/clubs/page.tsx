import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { serverApi } from '@/lib/server-api';
import { ClubCard } from '@/components/clubs/ClubCard';
import { CreateClubButton } from '@/components/clubs/CreateClubButton';
import { ClubSearch } from '@/components/clubs/ClubSearch';
import { Pagination } from '@/components/ui/Pagination';
import type { Metadata } from 'next';

interface Club {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isPublic: boolean;
  createdBy: { id: string; name: string };
  _count: { members: number; discussions: number };
}

export const metadata: Metadata = { title: 'Reading clubs' };

const LIMIT = 9;

interface Props {
  searchParams: Promise<{ page?: string; search?: string }>;
}

async function ClubsList({ searchParams }: Props) {
  const { page, search } = await searchParams;
  const currentPage = Number(page) || 1;

  const result = await serverApi.clubs.list({
    page: currentPage,
    limit: LIMIT,
    search,
  });

  const totalPages = result.meta.pages ?? Math.ceil(result.meta.total / LIMIT);

  if (totalPages > 0 && currentPage > totalPages) {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('page', String(totalPages));
    redirect(`/clubs?${params.toString()}`);
  }

  if (result.data.length === 0 && totalPages === 0) {
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
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Result count */}
      <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
        {result.meta.total} club{result.meta.total !== 1 ? 's' : ''}
      </p>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {result.data.map((club: Club) => (
          <ClubCard key={club.id} club={club} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={result.meta.page ?? currentPage}
          totalPages={totalPages}
          buildUrl={(p) => {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            params.set('page', String(p));
            return `/clubs?${params.toString()}`;
          }}
        />
      )}
    </div>
  );
}

// function ClubsPagination({
//   currentPage,
//   totalPages,
//   search,
// }: {
//   currentPage: number
//   totalPages: number
//   search?: string
// }) {
//   const buildUrl = (p: number) => {
//     const params = new URLSearchParams()
//     if (search) params.set('search', search)
//     params.set('page', String(p))
//     return `/clubs?${params.toString()}`
//   }

//   // Show a window of page numbers around the current page
//   const pages: (number | '...')[] = []
//   for (let i = 1; i <= totalPages; i++) {
//     if (
//       i === 1 ||
//       i === totalPages ||
//       (i >= currentPage - 1 && i <= currentPage + 1)
//     ) {
//       pages.push(i)
//     } else if (
//       i === currentPage - 2 ||
//       i === currentPage + 2
//     ) {
//       pages.push('...')
//     }
//   }

//   return (
//     <div className="flex items-center justify-center gap-1.5 pt-4">
//       {/* Previous */}
//       {currentPage > 1 ? (

//         <a href={buildUrl(currentPage - 1)}
//           className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
//           style={{
//             border: '1px solid hsl(var(--border))',
//             color: 'hsl(var(--foreground))',
//           }}
//         >
//           ← Prev
//         </a>
//       ) : (
//         <span
//           className="px-3 py-2 rounded-lg text-sm font-medium opacity-30 cursor-not-allowed"
//           style={{
//             border: '1px solid hsl(var(--border))',
//             color: 'hsl(var(--foreground))',
//           }}
//         >
//           ← Prev
//         </span>
//       )}

//       {/* Page numbers */}
//       {pages.map((p, i) =>
//         p === '...' ? (
//           <span
//             key={`dots-${i}`}
//             className="px-2 text-sm"
//             style={{ color: 'hsl(var(--muted-foreground))' }}
//           >
//             …
//           </span>
//         ) : (

//           <a key={p}
//             href={buildUrl(p)}
//             className="h-9 w-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors"
//             style={
//               p === currentPage
//                 ? { backgroundColor: '#2563eb', color: '#fff' }
//                 : {
//                   border: '1px solid hsl(var(--border))',
//                   color: 'hsl(var(--foreground))',
//                 }
//             }
//           >
//             {p}
//           </a>
//         )
//       )}

//       {/* Next */}
//       {currentPage < totalPages ? (

//         <a href={buildUrl(currentPage + 1)}
//           className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
//           style={{
//             border: '1px solid hsl(var(--border))',
//             color: 'hsl(var(--foreground))',
//           }}
//         >
//           Next →
//         </a>
//       ) : (
//         <span
//           className="px-3 py-2 rounded-lg text-sm font-medium opacity-30 cursor-not-allowed"
//           style={{
//             border: '1px solid hsl(var(--border))',
//             color: 'hsl(var(--foreground))',
//           }}
//         >
//           Next →
//         </span>
//       )}
//     </div>
//   )
// }

function ClubsSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: LIMIT }).map((_, i) => (
        <div
          key={i}
          className="h-40 rounded-xl animate-pulse"
          style={{ backgroundColor: 'hsl(var(--muted))' }}
        />
      ))}
    </div>
  );
}

export default async function ClubsPage({ searchParams }: Props) {
  const { search } = await searchParams;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Reading clubs</h1>
          <p style={{ color: 'hsl(var(--muted-foreground))' }}>
            Join a club, discuss books, and meet readers from around the world.
          </p>
        </div>
        <ClubSearch defaultValue={search} />
        <CreateClubButton />
      </div>

      <Suspense fallback={<ClubsSkeleton />}>
        <ClubsList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
