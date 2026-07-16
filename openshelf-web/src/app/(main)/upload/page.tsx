import { serverApi } from '@/lib/server-api';
import { UploadForm } from '@/components/resource/UploadForm';
import { RequireAuth } from '@/components/auth/RequireAuth';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Upload resource — OpenShelf' };

export default async function UploadPage() {
  const [categories, tags] = await Promise.all([
    serverApi.categories.list().catch(() => []),
    serverApi.tags.list().catch(() => []),
  ]);

  return (
    <RequireAuth requireVerified>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-0.5">Upload a resource</h1>
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Share a book, course, exam paper, document or audio file with the world.
          </p>
        </div>
        <UploadForm categories={categories} tags={tags} />
      </div>
    </RequireAuth>
  );
}
