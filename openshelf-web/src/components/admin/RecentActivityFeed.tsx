'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ActionBadge } from '@/components/admin/ActionBadge'; // reuse from /admin/audit if it exists as a standalone component

type AuditEntry = {
  id: string;
  action: string;
  targetType: string;
  targetName: string | null;
  actor: { name: string; avatarUrl: string | null; role: string };
  createdAt: string;
};

export function RecentActivityFeed() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/admin/audit', { params: { limit: 6 } })
      .then((res) => setEntries(res.data.entries ?? res.data.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Recent Activity</h3>
        <Link href="/admin/audit" className="text-xs text-blue-600 hover:underline">
          View all →
        </Link>
      </div>

      {loading ? (
        <div className="text-sm text-slate-400">Loading…</div>
      ) : entries.length === 0 ? (
        <div className="text-sm text-slate-400">No recent activity</div>
      ) : (
        <ul className="space-y-2">
          {entries.map((e) => (
            <li key={e.id} className="flex items-center gap-2 text-sm">
              <img
                src={e.actor.avatarUrl ?? '/default-avatar.png'}
                className="w-5 h-5 rounded-full"
                alt=""
              />
              <span className="font-medium">{e.actor.name}</span>
              <ActionBadge action={e.action} />
              <span className="text-slate-500 truncate">{e.targetName ?? e.targetType}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
