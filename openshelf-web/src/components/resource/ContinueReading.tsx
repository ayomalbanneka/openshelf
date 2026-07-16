'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import Link from 'next/link';

interface ProgressItem {
  id: string;
  currentPage: number;
  totalPages?: number;
  percentage: number;
  lastReadAt: string;
  resource: {
    id: string;
    title: string;
    slug: string;
    type: string;
    thumbnailUrl?: string;
    author?: string;
    pageCount?: number;
  };
}

const ICONS: Record<string, string> = {
  BOOK: '📖',
  COURSE: '🎓',
  EXAM_PAPER: '📝',
  DOCUMENT: '📄',
  AUDIO: '🎧',
};

export function ContinueReading() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<ProgressItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    api.progress
      .getMine()
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user || loading || items.length === 0) return null;

  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold mb-4">Continue reading</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/resources/${item.resource.slug}`}
            className="flex items-center gap-3 p-3 rounded-xl transition-all hover:-translate-y-0.5 group"
            style={{
              border: '1px solid hsl(var(--border))',
              backgroundColor: 'hsl(var(--background))',
            }}
          >
            {/* Icon / thumbnail */}
            <div
              className="h-12 w-10 rounded-lg flex items-center justify-center shrink-0 text-xl"
              style={{ backgroundColor: 'hsl(var(--muted))' }}
            >
              {item.resource.thumbnailUrl ? (
                <img
                  src={item.resource.thumbnailUrl}
                  alt={item.resource.title}
                  className="h-12 w-10 object-cover rounded-lg"
                />
              ) : (
                ICONS[item.resource.type] || '📄'
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate group-hover:text-blue-600 transition-colors">
                {item.resource.title}
              </p>
              {item.resource.author && (
                <p className="text-xs truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {item.resource.author}
                </p>
              )}

              {/* Progress bar */}
              <div className="mt-1.5">
                <div
                  className="w-full rounded-full h-1"
                  style={{ backgroundColor: 'hsl(var(--muted))' }}
                >
                  <div
                    className="h-1 rounded-full bg-blue-600 transition-all"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {Math.round(item.percentage)}%
                  {item.totalPages && item.currentPage
                    ? ` · p.${item.currentPage} of ${item.totalPages}`
                    : ''}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
