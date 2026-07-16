import { RequireAuth } from '@/components/auth/RequireAuth';
import { MyLists } from '@/components/lists/MyLists';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'My reading lists' };

export default function ListsPage() {
  return (
    <RequireAuth>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">My reading lists</h1>
          <p style={{ color: 'hsl(var(--muted-foreground))' }}>
            Organise resources into lists — like Goodreads shelves.
          </p>
        </div>
        <MyLists />
      </div>
    </RequireAuth>
  );
}
