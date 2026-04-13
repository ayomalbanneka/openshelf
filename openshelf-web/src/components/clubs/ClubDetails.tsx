'use client'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { api } from '@/lib/api'
import Link from 'next/link'

interface Member {
  role: string
  joinedAt: string
  user: { id: string; name: string; avatarUrl?: string }
}

interface Discussion {
  id: string
  title: string
  body: string
  createdAt: string
  author: { id: string; name: string }
  resource?: { id: string; title: string; slug: string; type: string }
  _count: { comments: number }
}

interface Club {
  id: string
  name: string
  slug: string
  description?: string
  isPublic: boolean
  createdBy: { id: string; name: string }
  members: Member[]
  _count: { members: number; discussions: number }
}

type Tab = 'discussions' | 'members'

export function ClubDetail({ club }: { club: Club }) {
  const { user } = useAuthStore()
  const [tab, setTab] = useState<Tab>('discussions')
  const [isMember, setIsMember] = useState(false)
  const [myRole, setMyRole] = useState<string | null>(null)
  const [memberCount, setMemberCount] = useState(club._count.members)
  const [joining, setJoining] = useState(false)
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [discLoading, setDiscLoading] = useState(true)
  const [showNewDisc, setShowNewDisc] = useState(false)
  const [discTitle, setDiscTitle] = useState('')
  const [discBody, setDiscBody] = useState('')
  const [posting, setPosting] = useState(false)
  const [postError, setPostError] = useState('')


  // Check membership
  useEffect(() => {
    if (!user) return
    api.clubs.getMembership(club.slug)
      .then((data) => {
        setIsMember(data.isMember)
        setMyRole(data.role)
      })
      .catch(() => { })
  }, [user, club.slug])

  // Load discussions
  useEffect(() => {
    api.clubs.getDiscussions(club.slug)
      .then(setDiscussions)
      .catch(() => { })
      .finally(() => setDiscLoading(false))
  }, [club.slug])

  const handleJoin = async () => {
    if (!user) return
    setJoining(true)
    try {
      await api.clubs.join(club.slug)
      setIsMember(true)
      setMyRole('MEMBER')
      setMemberCount((c) => c + 1)
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to join')
    } finally {
      setJoining(false)
    }
  }

  const handleLeave = async () => {
    if (!confirm('Leave this club?')) return
    setJoining(true)
    try {
      await api.clubs.leave(club.slug)
      setIsMember(false)
      setMyRole(null)
      setMemberCount((c) => c - 1)
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to leave')
    } finally {
      setJoining(false)
    }
  }

  const handlePostDiscussion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!discTitle.trim() || !discBody.trim()) {
      setPostError('Title and body are required')
      return
    }
    setPosting(true)
    setPostError('')
    try {
      const discussion = await api.clubs.createDiscussion(club.slug, {
        title: discTitle,
        body: discBody,
      })
      setDiscussions((prev) => [discussion, ...prev])
      setDiscTitle('')
      setDiscBody('')
      setShowNewDisc(false)
    } catch (err: any) {
      setPostError(err?.response?.data?.message || 'Failed to post')
    } finally {
      setPosting(false)
    }
  }

  const inputStyle = {
    border: '1px solid hsl(var(--border))',
    backgroundColor: 'hsl(var(--background))',
    color: 'hsl(var(--foreground))',
  }

  const isOwner = myRole === 'OWNER'

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">

      {/* ── Header ───────────────────────────────────── */}
      <div
        className="rounded-2xl p-6 mb-8"
        style={{
          border: '1px solid hsl(var(--border))',
          backgroundColor: 'hsl(var(--background))',
        }}
      >
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{club.name}</h1>
              {!club.isPublic && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: 'hsl(var(--muted))',
                    color: 'hsl(var(--muted-foreground))',
                  }}
                >
                  Private
                </span>
              )}
            </div>
            {club.description && (
              <p
                className="text-sm"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              >
                {club.description}
              </p>
            )}
            <p
              className="text-xs mt-2"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              {memberCount} members · {club._count.discussions} discussions ·
              created by{' '}
              <Link
                href={`/users/${club.createdBy.id}`}
                className="hover:text-blue-600 transition-colors"
              >
                {club.createdBy.name}
              </Link>
            </p>
          </div>

          {/* Action button */}
          <div className="shrink-0">
            {!user && (
              <Link
                href="/login"
                className="px-5 py-2 rounded-xl text-sm font-medium text-white"
                style={{ backgroundColor: '#2563eb' }}
              >
                Sign in to join
              </Link>
            )}
            {user && !isMember && (
              <button
                onClick={handleJoin}
                disabled={joining}
                className="px-5 py-2 rounded-xl text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#2563eb' }}
              >
                {joining ? 'Joining…' : 'Join club'}
              </button>
            )}
            {user && isMember && !isOwner && (
              <button
                onClick={handleLeave}
                disabled={joining}
                className="px-5 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                style={{
                  border: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--foreground))',
                }}
              >
                {joining ? '…' : 'Leave club'}
              </button>
            )}
            {user && isOwner && (
              <span
                className="px-5 py-2 rounded-xl text-sm font-medium"
                style={{
                  backgroundColor: 'hsl(var(--muted))',
                  color: 'hsl(var(--muted-foreground))',
                }}
              >
                Owner
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────── */}
      <div
        className="flex gap-1 mb-6 border-b"
        style={{ borderColor: 'hsl(var(--border))' }}
      >
        {(['discussions', 'members'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px"
            style={{
              borderColor: tab === t ? '#2563eb' : 'transparent',
              color: tab === t
                ? '#2563eb'
                : 'hsl(var(--muted-foreground))',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Discussions tab ───────────────────────────── */}
      {tab === 'discussions' && (
        <div className="flex flex-col gap-4">

          {/* New discussion button */}
          {isMember && (
            <div className="flex justify-end">
              <button
                onClick={() => setShowNewDisc(!showNewDisc)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                {showNewDisc ? 'Cancel' : '+ New discussion'}
              </button>
            </div>
          )}

          {/* New discussion form */}
          {showNewDisc && (
            <form
              onSubmit={handlePostDiscussion}
              className="flex flex-col gap-4 p-5 rounded-2xl"
              style={{
                border: '1px solid hsl(var(--border))',
                backgroundColor: 'hsl(var(--background))',
              }}
            >
              <h3 className="font-semibold">Start a discussion</h3>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  value={discTitle}
                  onChange={(e) => setDiscTitle(e.target.value)}
                  placeholder="e.g. What did you think of chapter 3?"
                  className="h-10 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  style={inputStyle}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">
                  Body <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={discBody}
                  onChange={(e) => setDiscBody(e.target.value)}
                  placeholder="Share your thoughts…"
                  rows={4}
                  className="rounded-lg px-3 py-2 text-sm outline-none resize-none focus:ring-2 focus:ring-blue-500"
                  style={inputStyle}
                />
              </div>

              {postError && (
                <p className="text-xs text-red-500">{postError}</p>
              )}

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowNewDisc(false)}
                  className="px-4 py-2 rounded-lg text-sm"
                  style={{
                    border: '1px solid hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={posting}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {posting ? 'Posting…' : 'Post discussion'}
                </button>
              </div>
            </form>
          )}

          {/* Discussion list */}
          {discLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 rounded-xl animate-pulse"
                  style={{ backgroundColor: 'hsl(var(--muted))' }}
                />
              ))}
            </div>
          ) : discussions.length === 0 ? (
            <div
              className="text-center py-16 rounded-2xl"
              style={{
                border: '2px dashed hsl(var(--border))',
                color: 'hsl(var(--muted-foreground))',
              }}
            >
              <p className="text-lg font-medium mb-1">No discussions yet</p>
              {isMember
                ? <p className="text-sm">Start the first discussion above.</p>
                : <p className="text-sm">Join the club to start a discussion.</p>
              }
            </div>
          ) : (
            discussions.map((d) => (
              <Link
                key={d.id}
                href={`/clubs/${club.slug}/discussions/${d.id}`}
                className="p-4 rounded-xl flex flex-col gap-2 transition-all hover:-translate-y-0.5"
                style={{
                  border: '1px solid hsl(var(--border))',
                  backgroundColor: 'hsl(var(--background))',
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium leading-snug">{d.title}</h3>
                  <span
                    className="text-xs shrink-0"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                  >
                    {d._count.comments} replies
                  </span>
                </div>
                <p
                  className="text-sm line-clamp-2"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                  {d.body}
                </p>
                {d.resource && (
                  <Link
                    href={`/resources/${d.resource.slug}`}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Re: {d.resource.title}
                  </Link>
                )}
                <p
                  className="text-xs"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                  by {d.author.name} ·{' '}
                  {new Date(d.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric',
                  })}
                </p>
              </Link>
            ))
          )}
        </div>
      )}

      {/* ── Members tab ───────────────────────────────── */}
      {tab === 'members' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {club.members.map((m) => (
            <Link
              key={m.user.id}
              href={`/users/${m.user.id}`}
              className="flex items-center gap-2 p-3 rounded-xl transition-colors hover:-translate-y-0.5"
              style={{
                border: '1px solid hsl(var(--border))',
                backgroundColor: 'hsl(var(--background))',
              }}
            >
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ backgroundColor: '#2563eb' }}
              >
                {m.user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{m.user.name}</p>
                <p
                  className="text-xs capitalize"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                  {m.role.toLowerCase()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

    </div>
  )
}