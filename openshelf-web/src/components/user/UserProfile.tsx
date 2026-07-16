'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { ResourceCard } from '@/components/resource/ResourceCard';
import Link from 'next/link';
import Image from 'next/image';
import type { Resource } from '@/types';
import { toast } from '@/lib/toast';
import { BadgeList } from '@/components/profile/BadgeList';

interface Badge {
  // ← add
  id: string;
  label: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'supporter' | 'patron';
  awardedAt: string | null;
}

interface UserData {
  id: string;
  name: string;
  bio?: string;
  avatarUrl?: string;
  website?: string;
  country?: string;
  createdAt: string;
  _count: { uploads: number; followers: number; following: number };
  badges?: Badge[];
}

interface Props {
  user: UserData;
  uploads: Resource[];
}

type AboutRow = { label: string; value: string; isLink?: boolean };

export function UserProfile({ user, uploads }: Props) {
  const { user: currentUser, setUser } = useAuthStore();
  const isMe = currentUser?.id === user.id;

  const [following, setFollowing] = useState(false);
  const [fLoading, setFLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(user._count.followers);
  const [activeTab, setActiveTab] = useState<'uploads' | 'about'>('uploads');

  useEffect(() => {
    if (!currentUser || isMe) return;
    api.users
      .isFollowing(user.id)
      .then((d) => setFollowing(d.isFollowing))
      .catch(() => {});
  }, [currentUser, user.id, isMe]);

  const handleFollow = async () => {
    if (!currentUser) return;
    setFLoading(true);
    try {
      if (following) {
        await api.users.unfollow(user.id);
        setFollowing(false);
        setFollowerCount((c) => c - 1);
      } else {
        await api.users.follow(user.id);
        setFollowing(true);
        setFollowerCount((c) => c + 1);
      }
      toast.success(following ? 'Unfollowed' : 'Following!');
    } catch {
      toast.error('Failed to update follow status');
    } finally {
      setFLoading(false);
    }
  };

  const joinedYear = new Date(user.createdAt).getFullYear();
  const displayAvatarUrl = isMe ? currentUser?.avatarUrl : user.avatarUrl;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleRemoveAvatar = async () => {
    if (!currentUser) return;
    try {
      const updated = await api.users.updateProfile({ avatarUrl: '' });
      setUser(updated);
      toast.success('Profile photo removed');
    } catch {
      toast.error('Failed to remove profile photo');
    }
  };

  const aboutRows: AboutRow[] = [
    user.bio ? { label: 'Bio', value: user.bio } : null,
    user.country ? { label: 'Country', value: user.country } : null,
    user.website ? { label: 'Website', value: user.website, isLink: true } : null,
    {
      label: 'Member since',
      value: new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      }),
    },
  ].filter((row): row is AboutRow => Boolean(row));

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* ── Banner + Avatar ──────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden mb-6"
        style={{
          border: '1px solid hsl(var(--border))',
          backgroundColor: 'hsl(var(--background))',
        }}
      >
        {/* Banner */}
        <div
          className="h-28 w-full"
          style={{
            background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #7c3aed 100%)',
          }}
        />

        {/* Avatar + info row */}
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-10">
            {/* Avatar */}
            <div
              className="relative h-20 w-20 rounded-2xl border-4 flex items-center justify-center text-2xl font-bold text-white shrink-0 overflow-hidden"
              style={{
                borderColor: 'hsl(var(--background))',
                backgroundColor: '#2563eb',
              }}
            >
              {displayAvatarUrl ? (
                <Image
                  src={displayAvatarUrl}
                  alt={`${user.name} avatar`}
                  width={80}
                  height={80}
                  unoptimized
                  className="h-20 w-20 object-cover"
                  style={{ width: 'auto', height: 'auto' }}
                />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold truncate">{user.name}</h1>
              <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Member since {joinedYear}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {!isMe && !currentUser && (
                <Link
                  href="/login"
                  className="px-5 py-2 rounded-xl text-sm font-medium text-white"
                  style={{ backgroundColor: '#2563eb' }}
                >
                  Follow
                </Link>
              )}
              {!isMe && currentUser && (
                <button
                  onClick={handleFollow}
                  disabled={fLoading}
                  className="px-5 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                  style={
                    following
                      ? { border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }
                      : { backgroundColor: '#2563eb', color: '#fff' }
                  }
                >
                  {fLoading ? '...' : following ? 'Following' : 'Follow'}
                </button>
              )}
              {isMe && (
                <>
                  <Link
                    href="/settings"
                    className="px-5 py-2 rounded-xl text-sm font-medium transition-colors"
                    style={{
                      border: '1px solid hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                    }}
                  >
                    Edit profile
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <p
              className="mt-4 text-sm leading-relaxed"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              {user.bio}
            </p>
          )}
          {user.website && (
            <a
              href={user.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 text-sm text-blue-600 hover:underline"
            >
              <svg
                width="13"
                height="13"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              {user.website.replace(/^https?:\/\//, '')}
            </a>
          )}

          {/* Stats */}
          <div
            className="flex gap-6 mt-5 pt-5"
            style={{ borderTop: '1px solid hsl(var(--border))' }}
          >
            {[
              { label: 'Uploads', value: user._count.uploads },
              { label: 'Followers', value: followerCount },
              { label: 'Following', value: user._count.following },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-lg font-bold leading-none">{s.value.toLocaleString()}</p>
                <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          {/* Badges */}
          {user.badges && user.badges.length > 0 && (
            <div className="mt-5 pt-5" style={{ borderTop: '1px solid hsl(var(--border))' }}>
              <BadgeList badges={user.badges} />
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────── */}
      <div className="flex gap-1 mb-6 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
        {(['uploads', 'about'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px"
            style={{
              borderColor: activeTab === tab ? '#2563eb' : 'transparent',
              color: activeTab === tab ? '#2563eb' : 'hsl(var(--muted-foreground))',
            }}
          >
            {tab}
            {tab === 'uploads' && ` (${user._count.uploads})`}
          </button>
        ))}
      </div>

      {/* ── Uploads tab ──────────────────────────────────── */}
      {activeTab === 'uploads' &&
        (uploads.length === 0 ? (
          <div
            className="text-center py-16 rounded-2xl"
            style={{
              border: '2px dashed hsl(var(--border))',
              color: 'hsl(var(--muted-foreground))',
            }}
          >
            <p className="font-medium mb-1">
              {isMe ? "You haven't uploaded anything yet." : 'No uploads yet.'}
            </p>
            {isMe && (
              <Link href="/upload" className="text-sm text-blue-600 hover:underline">
                Upload your first resource
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {uploads.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        ))}

      {/* ── About tab ────────────────────────────────────── */}
      {activeTab === 'about' && (
        <div
          className="rounded-2xl divide-y text-sm"
          style={{
            border: '1px solid hsl(var(--border))',
            backgroundColor: 'hsl(var(--background))',
          }}
        >
          {aboutRows.map((row) => (
            <div key={row.label} className="flex gap-6 px-6 py-4">
              <span className="w-28 shrink-0 font-medium text-sm">{row.label}</span>
              {row.isLink ? (
                <a
                  href={row.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {row.value}
                </a>
              ) : (
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>{row.value}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
