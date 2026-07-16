'use client';
import { useEffect, useState } from 'react';
import { http } from '@/lib/api';
import { Hash, RefreshCw, Trash2, Tags as TagsIcon } from 'lucide-react';

interface Tag {
  id: string;
  name: string;
  slug: string;
  _count: { resources: number };
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const fetch_ = () => {
    setLoading(true);
    http
      .get('/admin/tags')
      .then((r) => setTags(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch_();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete tag "#${name}"?`)) return;
    setActing(id);
    try {
      await http.delete(`/admin/tags/${id}`);
      setTags((p) => p.filter((t) => t.id !== id));
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--admin-text)' }}>
          Tags
        </h1>
        <p className="text-sm" style={{ color: 'var(--admin-muted)' }}>
          {tags.length} tags in use across all resources.
        </p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={fetch_}
          className="text-xs px-3 py-1.5 rounded-xl font-semibold inline-flex items-center gap-2"
          style={{
            backgroundColor: 'var(--admin-soft)',
            color: 'var(--admin-text)',
            border: '1px solid var(--admin-border)',
          }}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="h-8 w-24 rounded-full animate-pulse"
              style={{ backgroundColor: 'var(--admin-soft)' }}
            />
          ))}
        </div>
      ) : tags.length === 0 ? (
        <div
          className="py-16 text-center text-sm rounded-2xl"
          style={{ border: '2px dashed var(--admin-border)', color: 'var(--admin-muted)' }}
        >
          No tags yet.
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            backgroundColor: 'var(--admin-surface)',
            border: '1px solid var(--admin-border)',
            boxShadow: 'var(--admin-card-shadow)',
          }}
        >
          <div
            className="grid grid-cols-12 gap-3 px-5 py-3 text-xs font-bold uppercase tracking-wider"
            style={{
              backgroundColor: 'var(--admin-soft)',
              color: 'var(--admin-muted)',
              borderBottom: '1px solid var(--admin-border)',
            }}
          >
            <div className="col-span-5">Tag</div>
            <div className="col-span-4">Slug</div>
            <div className="col-span-2 text-center">Resources</div>
            <div className="col-span-1" />
          </div>
          {tags.map((tag, i) => (
            <div
              key={tag.id}
              className="grid grid-cols-12 gap-3 px-5 py-3 items-center text-sm"
              style={{ borderTop: i === 0 ? 'none' : '1px solid var(--admin-border)' }}
            >
              <div className="col-span-5">
                <span
                  className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--admin-accent) 14%, transparent)',
                    color: 'var(--admin-accent)',
                  }}
                >
                  <Hash className="h-3.5 w-3.5" />
                  {tag.name}
                </span>
              </div>
              <div className="col-span-4 text-xs font-mono" style={{ color: 'var(--admin-muted)' }}>
                {tag.slug}
              </div>
              <div className="col-span-2 text-center" style={{ color: 'var(--admin-text)' }}>
                {tag._count.resources}
              </div>
              <div className="col-span-1 flex justify-end">
                <button
                  onClick={() => handleDelete(tag.id, tag.name)}
                  disabled={acting === tag.id}
                  className="text-xs px-2.5 py-1 rounded-lg font-medium inline-flex items-center gap-1.5 disabled:opacity-50"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--admin-danger) 14%, transparent)',
                    color: 'var(--admin-danger)',
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {acting === tag.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
