'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { Comment } from './Comment';
import Link from 'next/link';

interface CommentData {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author: { id: string; name: string; avatarUrl?: string };
  replies: CommentData[];
}

export function CommentsSection({ slug }: { slug: string }) {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.comments
      .getForResource(slug)
      .then(setComments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      const comment = await api.comments.create(slug, body);
      setComments((prev) => [comment, ...prev]);
      setBody('');
      toast.success('Comment posted');
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ??
            'Failed to post comment')
          : 'Failed to post comment';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Add a reply to the correct parent in the tree
  const handleReplyAdded = (parentId: string, reply: CommentData) => {
    const addReplyInTree = (comments: CommentData[]): CommentData[] =>
      comments.map((c) => {
        if (c.id === parentId) {
          return { ...c, replies: [...(c.replies || []), reply] };
        }
        if (c.replies && c.replies.length > 0) {
          return { ...c, replies: addReplyInTree(c.replies) };
        }
        return c;
      });

    setComments(addReplyInTree);
  };

  // Update comment body in the tree
  const handleUpdated = (id: string, newBody: string) => {
    const updateInTree = (comments: CommentData[]): CommentData[] =>
      comments.map((c) =>
        c.id === id
          ? { ...c, body: newBody, updatedAt: new Date().toISOString() }
          : { ...c, replies: updateInTree(c.replies || []) }
      );
    setComments(updateInTree);
  };

  // Remove comment or replace with [deleted]
  const handleDeleted = (id: string) => {
    const deleteInTree = (comments: CommentData[]): CommentData[] =>
      comments
        .map((c): CommentData | null => {
          if (c.id === id) {
            // If it has replies, soft-delete
            if (c.replies && c.replies.length > 0) {
              return { ...c, body: '[deleted]' };
            }
            return null;
          }
          return {
            ...c,
            replies: deleteInTree(c.replies || []).filter(Boolean),
          };
        })
        .filter((c): c is CommentData => c !== null);

    setComments(deleteInTree);
  };

  const inputStyle = {
    border: '1px solid hsl(var(--border))',
    backgroundColor: 'hsl(var(--background))',
    color: 'hsl(var(--foreground))',
  };

  const totalCount = comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);

  return (
    <div className="mt-14">
      <h2 className="text-xl font-bold mb-6">
        Comments
        {totalCount > 0 && (
          <span
            className="text-sm font-normal ml-2"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            {totalCount}
          </span>
        )}
      </h2>

      {/* Comment form */}
      {user ? (
        user.isEmailVerified ? (
          <form onSubmit={handleSubmit} className="flex gap-3 mb-8">
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-1"
              style={{ backgroundColor: '#2563eb' }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Leave a comment…"
                rows={3}
                className="w-full rounded-xl px-3 py-2 text-sm outline-none resize-none focus:ring-2 focus:ring-blue-500"
                style={inputStyle}
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !body.trim()}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Posting…' : 'Post comment'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div
            className="flex items-center gap-3 p-4 rounded-xl mb-8"
            style={{
              backgroundColor: '#fffbeb',
              border: '1px solid #fcd34d',
            }}
          >
            <span>⚠️</span>
            <p className="text-sm text-amber-800">
              <Link href="/verify-email" className="font-medium hover:underline">
                Verify your email
              </Link>{' '}
              to leave a comment.
            </p>
          </div>
        )
      ) : (
        <div
          className="flex items-center gap-3 p-4 rounded-xl mb-8"
          style={{
            border: '1px solid hsl(var(--border))',
            backgroundColor: 'hsl(var(--muted) / 0.4)',
          }}
        >
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            <Link href="/login" className="text-blue-600 font-medium hover:underline">
              Sign in
            </Link>{' '}
            to leave a comment.
          </p>
        </div>
      )}

      {/* Comment list */}
      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div
                className="h-8 w-8 rounded-full animate-pulse shrink-0"
                style={{ backgroundColor: 'hsl(var(--muted))' }}
              />
              <div className="flex-1 flex flex-col gap-2">
                <div
                  className="h-4 w-32 rounded animate-pulse"
                  style={{ backgroundColor: 'hsl(var(--muted))' }}
                />
                <div
                  className="h-16 rounded-lg animate-pulse"
                  style={{ backgroundColor: 'hsl(var(--muted))' }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-center py-10" style={{ color: 'hsl(var(--muted-foreground))' }}>
          No comments yet. {user?.isEmailVerified ? 'Be the first!' : ''}
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {comments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              slug={slug}
              depth={0}
              onReplyAdded={handleReplyAdded}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
