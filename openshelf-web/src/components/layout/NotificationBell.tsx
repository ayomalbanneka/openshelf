'use client';
import { useEffect, useRef, useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import { http } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

const relTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const TYPE_ICON: Record<string, string> = {
  RESOURCE_PUBLISHED: '🎉',
  RESOURCE_REJECTED: '📋',
  NEW_FOLLOWER: '👤',
  COMMENT_ON_RESOURCE: '💬',
  CLUB_INVITE: '👥',
};

export function NotificationBell() {
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = () => {
    if (!user) return;
    setLoading(true);
    http
      .get('/notifications?limit=15')
      .then(({ data }) => {
        setNotifications(data.data);
        setUnread(data.meta.unreadCount);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    // Poll every 30 seconds for new notifications
    const id = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(id);
  }, [user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkRead = async (id: string) => {
    await http.patch(`/notifications/${id}/read`).catch(() => {});
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
  };

  const handleMarkAllRead = async () => {
    await http.patch('/notifications/read-all').catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
  };

  const handleDelete = async (id: string, wasUnread: boolean) => {
    await http.delete(`/notifications/${id}`).catch(() => {});
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (wasUnread) setUnread((u) => Math.max(0, u - 1));
  };

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open) fetchNotifications();
        }}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
        style={{ color: 'hsl(var(--foreground))' }}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span
            className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold text-white"
            style={{ backgroundColor: '#dc2626' }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 mt-2 w-80 rounded-2xl overflow-hidden z-50"
          style={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid hsl(var(--border))' }}
          >
            <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              Notifications{' '}
              {unread > 0 && (
                <span
                  className="ml-1 text-xs font-bold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: '#dc2626', color: '#fff' }}
                >
                  {unread}
                </span>
              )}
            </p>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="p-1.5 rounded-lg transition-colors"
                  title="Mark all read"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div
                className="py-8 text-center text-sm"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              >
                Loading…
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const inner = (
                  <div
                    className="flex items-start gap-3 px-4 py-3 transition-colors group"
                    style={{
                      backgroundColor: n.isRead ? 'transparent' : 'rgba(59,130,246,0.04)',
                      borderBottom: '1px solid hsl(var(--border))',
                    }}
                  >
                    <span className="text-lg shrink-0 mt-0.5">{TYPE_ICON[n.type] ?? '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-semibold leading-snug"
                        style={{ color: 'hsl(var(--foreground))' }}
                      >
                        {n.title}
                      </p>
                      <p
                        className="text-xs mt-0.5 line-clamp-2"
                        style={{ color: 'hsl(var(--muted-foreground))' }}
                      >
                        {n.body}
                      </p>
                      <p
                        className="text-[10px] mt-1"
                        style={{ color: 'hsl(var(--muted-foreground))' }}
                      >
                        {relTime(n.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!n.isRead && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleMarkRead(n.id);
                          }}
                          className="p-1 rounded-lg"
                          title="Mark read"
                          style={{ color: 'hsl(var(--muted-foreground))' }}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete(n.id, !n.isRead);
                        }}
                        className="p-1 rounded-lg"
                        title="Delete"
                        style={{ color: 'hsl(var(--muted-foreground))' }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );

                return n.link ? (
                  <Link
                    key={n.id}
                    href={n.link}
                    onClick={() => {
                      handleMarkRead(n.id);
                      setOpen(false);
                    }}
                  >
                    {inner}
                  </Link>
                ) : (
                  <div key={n.id}>{inner}</div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
