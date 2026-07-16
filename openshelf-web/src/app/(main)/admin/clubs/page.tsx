'use client';
import { useEffect, useState, useRef } from 'react';
import { http } from '@/lib/api';
import Link from 'next/link';
import { Users, MessageCircle, Trash2, Search, ArrowLeft, ArrowRight } from 'lucide-react';

interface Club {
  id: string;
  name: string;
  slug: string;
  isPublic: boolean;
  createdAt: string;
  createdBy: { id: string; name: string; email: string };
  _count: { members: number; discussions: number };
}

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const limit = 12;

  const fetch_ = (q = search, p = page) => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: String(p), limit: String(limit) });
    if (q) params.set('search', q);
    http
      .get(`/admin/clubs?${params}`)
      .then((r) => {
        setClubs(r.data.data);
        setTotal(r.data.meta.total);
        setPages(r.data.meta.pages);
        setPage(r.data.meta.page);
      })
      .catch(() => setError('Failed to load clubs'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch_(search, page);
  }, [page]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    const shouldFetchNow = page === 1;
    setSearch(q);
    setPage(1);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (shouldFetchNow) fetch_(q, 1);
    }, 350);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete club "${name}" and all its content? This cannot be undone.`)) return;
    setActing(id);
    try {
      await http.delete(`/admin/clubs/${id}`);
      setClubs((p) => p.filter((c) => c.id !== id));
      setTotal((t) => t - 1);
    } finally {
      setActing(null);
    }
  };

  const inputStyle = {
    border: '1px solid var(--admin-border)',
    backgroundColor: 'var(--admin-surface)',
    color: 'var(--admin-text)',
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--admin-text)' }}>
            Reading Clubs
          </h1>
          <p className="text-sm" style={{ color: 'var(--admin-muted)' }}>
            {total} clubs
          </p>
        </div>
        <label className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: 'var(--admin-muted)' }}
          />
          <input
            value={search}
            onChange={handleSearch}
            placeholder="Search clubs…"
            className="h-9 rounded-xl pl-9 pr-3 text-sm outline-none w-52"
            style={inputStyle}
          />
        </label>
      </div>

      {error && (
        <div
          className="flex items-center justify-between gap-3 text-sm rounded-xl px-4 py-3"
          style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}
        >
          <span>{error}</span>
          <button
            onClick={() => fetch_(search, page)}
            className="text-xs px-3 py-1.5 rounded-xl font-semibold"
            style={{ backgroundColor: '#fecaca', color: '#7f1d1d' }}
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-36 rounded-2xl animate-pulse"
              style={{ backgroundColor: 'var(--admin-soft)' }}
            />
          ))}
        </div>
      ) : clubs.length === 0 ? (
        <div
          className="py-16 text-center text-sm rounded-2xl"
          style={{ border: '2px dashed var(--admin-border)', color: 'var(--admin-muted)' }}
        >
          No clubs found.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clubs.map((club) => (
            <div
              key={club.id}
              className="rounded-2xl p-5 flex flex-col gap-3 transition-all hover:-translate-y-0.5"
              style={{
                backgroundColor: 'var(--admin-surface)',
                border: '1px solid var(--admin-border)',
                boxShadow: 'var(--admin-card-shadow)',
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/clubs/${club.slug}`}
                    target="_blank"
                    className="font-semibold hover:text-blue-600 transition-colors"
                    style={{ color: 'var(--admin-text)' }}
                  >
                    {club.name}
                  </Link>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--admin-muted)' }}>
                    by {club.createdBy.name}
                  </p>
                </div>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                  style={
                    club.isPublic
                      ? {
                          backgroundColor:
                            'color-mix(in srgb, var(--admin-success) 16%, transparent)',
                          color: 'var(--admin-success)',
                        }
                      : { backgroundColor: 'var(--admin-soft)', color: 'var(--admin-muted)' }
                  }
                >
                  {club.isPublic ? 'Public' : 'Private'}
                </span>
              </div>
              <div className="flex gap-4 text-xs" style={{ color: 'var(--admin-muted)' }}>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" /> {club._count.members} members
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MessageCircle className="h-3.5 w-3.5" /> {club._count.discussions} discussions
                </span>
              </div>
              <div
                className="flex items-center justify-between pt-2"
                style={{ borderTop: '1px solid var(--admin-border)' }}
              >
                <span className="text-xs" style={{ color: 'var(--admin-muted)' }}>
                  {new Date(club.createdAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleDelete(club.id, club.name)}
                  disabled={acting === club.id}
                  className="text-xs px-3 py-1 rounded-lg font-medium transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--admin-danger) 14%, transparent)',
                    color: 'var(--admin-danger)',
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {acting === club.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="text-xs px-3 py-1.5 rounded-xl font-semibold disabled:opacity-50 inline-flex items-center gap-1.5"
            style={{ backgroundColor: 'var(--admin-soft)', color: 'var(--admin-text)' }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Prev
          </button>
          <span className="text-xs" style={{ color: 'var(--admin-muted)' }}>
            Page {page} of {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages || loading}
            className="text-xs px-3 py-1.5 rounded-xl font-semibold disabled:opacity-50 inline-flex items-center gap-1.5"
            style={{ backgroundColor: 'var(--admin-soft)', color: 'var(--admin-text)' }}
          >
            Next
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
