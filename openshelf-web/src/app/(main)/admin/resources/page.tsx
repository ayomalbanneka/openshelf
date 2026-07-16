'use client';
import { useEffect, useState, useRef } from 'react';
import { http } from '@/lib/api';
import Link from 'next/link';
import { getErrorMessage } from '@/lib/errors';
import { EditResourceModal } from '@/components/admin/EditResourceModal';

interface Resource {
  id: string;
  title: string;
  slug: string;
  type: string;
  language: string;
  isPublished: boolean;
  createdAt: string;
  viewCount: number;
  uploadedBy: { id: string; name: string };
  category: { name: string };
  _count: { reviews: number; bookmarks: number };
}

interface AdminResource extends Resource {
  author?: string;
  description?: string;
  publisher?: string;
  publicationYear?: number;
  pageCount?: number;
  category: { id: string; name: string };
}

const TYPE_COLORS: Record<string, { backgroundColor: string; color: string }> = {
  BOOK: { backgroundColor: '#e0f2fe', color: '#0284c7' },
  COURSE: { backgroundColor: '#ccfbf1', color: '#0f766e' },
  EXAM_PAPER: { backgroundColor: '#ffedd5', color: '#9a3412' },
  DOCUMENT: { backgroundColor: '#dcfce7', color: '#166534' },
  AUDIO: { backgroundColor: '#ffe4e6', color: '#be123c' },
};

const TYPES = ['', 'BOOK', 'COURSE', 'EXAM_PAPER', 'DOCUMENT', 'AUDIO'];

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [editTarget, setEditTarget] = useState<AdminResource | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const limit = 20;

  const fetch_ = (q = search, t = type, p = page) => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (q) params.set('search', q);
    if (t) params.set('type', t);
    params.set('page', String(p));
    params.set('limit', String(limit));
    http
      .get(`/admin/resources?${params}`)
      .then((r) => {
        setResources(r.data.data);
        setTotal(r.data.meta.total);
        setPages(r.data.meta.pages);
        setPage(r.data.meta.page);
      })
      .catch((err) => setError(getErrorMessage(err, 'Failed to load resources')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch_(search, type, page);
  }, [page]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    const shouldFetchNow = page === 1;
    setSearch(q);
    setPage(1);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (shouldFetchNow) fetch_(q, type, 1);
    }, 350);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setActing(id);
    try {
      await http.delete(`/admin/resources/${id}`);
      setResources((p) => p.filter((r) => r.id !== id));
      setTotal((t) => t - 1);
    } finally {
      setActing(null);
    }
  };

  const row = 'grid grid-cols-12 gap-3 px-4 py-3 items-center text-sm';
  const inputStyle = {
    border: '1px solid var(--admin-border)',
    backgroundColor: 'var(--admin-surface)',
    color: 'var(--admin-text)',
  };

  const openEdit = (resource: AdminResource) => setEditTarget(resource);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--admin-text)' }}>
            Resources
          </h1>
          <p className="text-sm" style={{ color: 'var(--admin-muted)' }}>
            {total} published resources
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={type}
            onChange={(e) => {
              const next = e.target.value;
              const shouldFetchNow = page === 1;
              setType(next);
              setPage(1);
              if (shouldFetchNow) fetch_(search, next, 1);
            }}
            className="h-9 rounded-xl px-3 text-sm outline-none"
            style={inputStyle}
          >
            <option value="">All types</option>
            {TYPES.filter(Boolean).map((t) => (
              <option key={t} value={t}>
                {t.replace('_', ' ')}
              </option>
            ))}
          </select>
          <input
            value={search}
            onChange={handleSearch}
            placeholder="Search…"
            className="h-9 rounded-xl px-3 text-sm outline-none w-52"
            style={inputStyle}
          />
        </div>
      </div>

      {error && (
        <div
          className="flex items-center justify-between gap-3 text-sm rounded-xl px-4 py-3"
          style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}
        >
          <span>{error}</span>
          <button
            onClick={() => fetch_(search, type, page)}
            className="text-xs px-3 py-1.5 rounded-xl font-semibold"
            style={{ backgroundColor: '#fecaca', color: '#7f1d1d' }}
          >
            Retry
          </button>
        </div>
      )}

      <div
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: 'var(--admin-surface)',
          border: '1px solid var(--admin-border)',
          boxShadow: 'var(--admin-card-shadow)',
        }}
      >
        {/* Header */}
        <div
          className={`${row} text-xs font-bold uppercase tracking-wider`}
          style={{
            backgroundColor: 'var(--admin-soft)',
            color: 'var(--admin-muted)',
            borderBottom: '1px solid var(--admin-border)',
          }}
        >
          <div className="col-span-4">Resource</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2 text-center">Views</div>
          <div className="col-span-2 text-center">Reviews</div>
          <div className="col-span-2 text-center">Actions</div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-0">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 mx-4 my-2 rounded-xl animate-pulse"
                style={{ backgroundColor: 'var(--admin-soft)' }}
              />
            ))}
          </div>
        ) : resources.length === 0 ? (
          <div className="py-16 text-center text-sm" style={{ color: 'var(--admin-muted)' }}>
            No resources found.
          </div>
        ) : (
          resources.map((r, i) => (
            <div
              key={r.id}
              className={row}
              style={{ borderTop: i === 0 ? 'none' : '1px solid var(--admin-border)' }}
            >
              <div className="col-span-4 min-w-0">
                <Link
                  href={`/resources/${r.slug}`}
                  target="_blank"
                  className="text-sm font-medium truncate block hover:text-blue-600 transition-colors"
                  style={{ color: 'var(--admin-text)' }}
                >
                  {r.title}
                </Link>
                <p className="text-xs truncate" style={{ color: 'var(--admin-muted)' }}>
                  {r.uploadedBy.name} · {r.category.name}
                </p>
              </div>
              <div className="col-span-2">
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={TYPE_COLORS[r.type] ?? { backgroundColor: '#f1f5f9', color: '#475569' }}
                >
                  {r.type.replace('_', ' ')}
                </span>
              </div>
              <div
                className="col-span-2 text-center text-sm"
                style={{ color: 'var(--admin-muted)' }}
              >
                {r.viewCount}
              </div>
              <div
                className="col-span-2 text-center text-sm"
                style={{ color: 'var(--admin-muted)' }}
              >
                {r._count.reviews}
              </div>
              <div className="col-span-2 flex justify-center">
                <button
                  onClick={() => openEdit(r as AdminResource)}
                  className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                  style={{ backgroundColor: '#eff6ff', color: '#1e40af' }}
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(r.id, r.title)}
                  disabled={acting === r.id}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}
                >
                  {acting === r.id ? '...' : 'Delete'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit resource modal */}
      <EditResourceModal
        resource={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={() => fetch_()}
      />

      {pages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="text-xs px-3 py-1.5 rounded-xl font-semibold disabled:opacity-50"
            style={{ backgroundColor: 'var(--admin-soft)', color: 'var(--admin-text)' }}
          >
            Prev
          </button>
          <span className="text-xs" style={{ color: 'var(--admin-muted)' }}>
            Page {page} of {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages || loading}
            className="text-xs px-3 py-1.5 rounded-xl font-semibold disabled:opacity-50"
            style={{ backgroundColor: 'var(--admin-soft)', color: 'var(--admin-text)' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
