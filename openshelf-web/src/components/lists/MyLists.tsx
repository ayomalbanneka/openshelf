'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import Link from 'next/link';
import { Pagination } from '@/components/ui/Pagination';

interface ReadingList {
  id: string;
  title: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { items: number };
}

const LIMIT = 10;

export function MyLists() {
  const [lists, setLists] = useState<ReadingList[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchLists = async (p: number) => {
    setLoading(true);
    try {
      const result = await api.lists.getMine(p, LIMIT);
      setLists(result.data);
      setTotal(result.meta.total);
      setTotalPages(result.meta.pages);
    } catch {
      toast.error('Failed to load lists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists(page);
  }, [page]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Title is required');
      return;
    }
    setCreating(true);
    setFormError('');
    try {
      await api.lists.create({ title, description, isPublic });
      toast.success('List created');
      setTitle('');
      setDescription('');
      setIsPublic(true);
      setShowForm(false);
      // Refresh back to page 1
      setPage(1);
      fetchLists(1);
    } catch {
      toast.error('Failed to create list');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this list?')) return;
    try {
      await api.lists.remove(id);
      toast.success('List deleted');
      // If deleting the last item on a page, go back
      const newTotal = total - 1;
      const newPage = Math.min(page, Math.ceil(newTotal / LIMIT)) || 1;
      setPage(newPage);
      fetchLists(newPage);
    } catch {
      toast.error('Failed to delete list');
    }
  };

  const inputStyle = {
    border: '1px solid hsl(var(--border))',
    backgroundColor: 'hsl(var(--background))',
    color: 'hsl(var(--foreground))',
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {total} list{total !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Cancel' : '+ New list'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="flex flex-col gap-4 p-5 rounded-2xl"
          style={{
            border: '1px solid hsl(var(--border))',
            backgroundColor: 'hsl(var(--background))',
          }}
        >
          <h2 className="font-semibold">Create a new list</h2>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Books to read in 2025"
              className="h-10 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              style={inputStyle}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description…"
              rows={2}
              className="rounded-lg px-3 py-2 text-sm outline-none resize-none focus:ring-2 focus:ring-blue-500"
              style={inputStyle}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="rounded"
            />
            Make this list public
          </label>

          {formError && <p className="text-xs text-red-500">{formError}</p>}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg text-sm transition-colors"
              style={{
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--foreground))',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {creating ? 'Creating…' : 'Create list'}
            </button>
          </div>
        </form>
      )}

      {/* Lists */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-xl animate-pulse"
              style={{ backgroundColor: 'hsl(var(--muted))' }}
            />
          ))}
        </div>
      ) : lists.length === 0 ? (
        <div
          className="text-center py-16 rounded-2xl"
          style={{
            border: '2px dashed hsl(var(--border))',
            color: 'hsl(var(--muted-foreground))',
          }}
        >
          <p className="text-lg font-medium mb-1">No lists yet</p>
          <p className="text-sm">Create your first reading list above.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {lists.map((list) => (
              <div
                key={list.id}
                className="flex items-center justify-between gap-4 p-4 rounded-xl"
                style={{
                  border: '1px solid hsl(var(--border))',
                  backgroundColor: 'hsl(var(--background))',
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/lists/${list.id}`}
                      className="font-medium hover:text-blue-600 transition-colors truncate"
                    >
                      {list.title}
                    </Link>
                    {!list.isPublic && (
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
                  {list.description && (
                    <p
                      className="text-sm mt-0.5 truncate"
                      style={{ color: 'hsl(var(--muted-foreground))' }}
                    >
                      {list.description}
                    </p>
                  )}
                  <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {list._count.items} {list._count.items === 1 ? 'item' : 'items'} · Updated{' '}
                    {new Date(list.updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                <button
                  onClick={() => handleDelete(list.id)}
                  className="text-xs px-3 py-1.5 rounded-lg transition-colors shrink-0 hover:bg-red-50 hover:text-red-600"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          )}
        </>
      )}
    </div>
  );
}

// ── Pagination component (reserved for future use) ───────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _ListsPagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pages: (number | '...')[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      pages.push('...');
    }
  }

  return (
    <div className="flex items-center justify-center gap-1.5 pt-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        style={{
          border: '1px solid hsl(var(--border))',
          color: 'hsl(var(--foreground))',
        }}
      >
        ← Prev
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span
            key={`dots-${i}`}
            className="px-2 text-sm"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className="h-9 w-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors"
            style={
              p === currentPage
                ? { backgroundColor: '#2563eb', color: '#fff' }
                : {
                    border: '1px solid hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
                  }
            }
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        style={{
          border: '1px solid hsl(var(--border))',
          color: 'hsl(var(--foreground))',
        }}
      >
        Next →
      </button>
    </div>
  );
}
