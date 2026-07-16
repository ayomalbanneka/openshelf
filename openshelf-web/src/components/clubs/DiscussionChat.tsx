'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import Link from 'next/link';
import { getErrorMessage } from '@/lib/errors';

interface Author {
  id: string;
  name: string;
}

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  author: Author;
}

interface Resource {
  id: string;
  title: string;
  slug: string;
  type: string;
}

interface Discussion {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  author: Author;
  resource?: Resource;
  _count: { comments: number };
}

interface Props {
  clubSlug: string;
  discussionId: string;
  discussion: Discussion;
}

export function DiscussionChat({ clubSlug, discussionId, discussion }: Props) {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const inputStyle = {
    border: '1px solid hsl(var(--border))',
    backgroundColor: 'hsl(var(--background))',
    color: 'hsl(var(--foreground))',
  };

  useEffect(() => {
    if (!user) return;
    api.clubs
      .getMembership(clubSlug)
      .then((data) => setIsMember(data.isMember))
      .catch(() => {});
  }, [user, clubSlug]);

  useEffect(() => {
    api.clubs
      .getComments(clubSlug, discussionId)
      .then(setComments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clubSlug, discussionId]);

  useEffect(() => {
    if (!loading) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [loading, comments.length]);

  const submitComment = async () => {
    if (!body.trim()) return;
    setPosting(true);
    setError('');
    try {
      const comment = await api.clubs.createComment(clubSlug, discussionId, body.trim());
      setComments((prev) => [...prev, comment]);
      setBody('');
      textareaRef.current?.focus();
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to post comment'));
    } finally {
      setPosting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitComment();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitComment();
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-6">
      {/* ── Back link ───────────────────────────────── */}
      <Link
        href={`/clubs/${clubSlug}`}
        className="flex items-center gap-1.5 text-sm w-fit transition-colors hover:opacity-70"
        style={{ color: 'hsl(var(--muted-foreground))' }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M10 3L5 8L10 13"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back to club
      </Link>

      {/* ── Discussion header ────────────────────────── */}
      <div
        className="rounded-2xl p-6"
        style={{
          border: '1px solid hsl(var(--border))',
          backgroundColor: 'hsl(var(--background))',
        }}
      >
        <h1 className="text-xl font-bold mb-2">{discussion.title}</h1>
        <p className="text-sm leading-relaxed mb-4" style={{ color: 'hsl(var(--foreground))' }}>
          {discussion.body}
        </p>
        {discussion.resource && (
          <Link
            href={`/resources/${discussion.resource.slug}`}
            className="text-xs text-blue-600 hover:underline"
          >
            Re: {discussion.resource.title}
          </Link>
        )}
        <p className="text-xs mt-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Started by {discussion.author.name} · {formatTime(discussion.createdAt)}
        </p>
      </div>

      {/* ── Comments ─────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {comments.length === 0 && !loading
            ? 'No replies yet'
            : `${comments.length} ${comments.length === 1 ? 'reply' : 'replies'}`}
        </h2>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 rounded-xl animate-pulse"
                style={{ backgroundColor: 'hsl(var(--muted))' }}
              />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div
            className="text-center py-12 rounded-2xl"
            style={{
              border: '2px dashed hsl(var(--border))',
              color: 'hsl(var(--muted-foreground))',
            }}
          >
            <p className="text-sm">
              {isMember
                ? 'Be the first to reply below.'
                : 'Join the club to participate in this discussion.'}
            </p>
          </div>
        ) : (
          comments.map((c) => {
            const isOwn = user?.id === c.author.id;
            return (
              <div key={c.id} className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-1"
                  style={{ backgroundColor: isOwn ? '#2563eb' : '#6b7280' }}
                >
                  {c.author.name.charAt(0).toUpperCase()}
                </div>

                {/* Bubble */}
                <div
                  className={`flex flex-col gap-1 max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{isOwn ? 'You' : c.author.name}</span>
                    <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {formatTime(c.createdAt)}
                    </span>
                  </div>
                  <div
                    className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                    style={
                      isOwn
                        ? { backgroundColor: '#2563eb', color: '#fff' }
                        : {
                            backgroundColor: 'hsl(var(--muted))',
                            color: 'hsl(var(--foreground))',
                          }
                    }
                  >
                    {c.body}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Reply box ─────────────────────────────────── */}
      {!user ? (
        <div
          className="text-center py-4 rounded-xl text-sm"
          style={{
            border: '1px solid hsl(var(--border))',
            color: 'hsl(var(--muted-foreground))',
          }}
        >
          <Link href="/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>{' '}
          to reply to this discussion.
        </div>
      ) : !isMember ? (
        <div
          className="text-center py-4 rounded-xl text-sm"
          style={{
            border: '1px solid hsl(var(--border))',
            color: 'hsl(var(--muted-foreground))',
          }}
        >
          Join this club to participate in discussions.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-2"
          style={{
            border: '1px solid hsl(var(--border))',
            backgroundColor: 'hsl(var(--background))',
            borderRadius: '1rem',
            padding: '1rem',
          }}
        >
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a reply… (Enter to send, Shift+Enter for new line)"
            rows={3}
            className="w-full text-sm outline-none resize-none rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            style={inputStyle}
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={posting || !body.trim()}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {posting ? 'Sending…' : 'Send reply'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
