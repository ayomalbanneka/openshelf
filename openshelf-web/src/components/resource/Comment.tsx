'use client';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

interface CommentData {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author: { id: string; name: string; avatarUrl?: string };
  replies: CommentData[];
}

interface Props {
  comment: CommentData;
  slug: string;
  depth?: number;
  onReplyAdded: (parentId: string, reply: CommentData) => void;
  onUpdated: (id: string, body: string) => void;
  onDeleted: (id: string, parentId?: string) => void;
}

export function Comment({ comment, slug, depth = 0, onReplyAdded, onUpdated, onDeleted }: Props) {
  const { user } = useAuthStore();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [editBody, setEditBody] = useState(comment.body);
  const [submitting, setSubmitting] = useState(false);

  const isDeleted = comment.body === '[deleted]';
  const isAuthor = user?.id === comment.authorId;
  const isPrivileged = user?.role === 'ADMIN' || user?.role === 'MODERATOR';
  const canReply = depth < 2; // max 4 levels of nesting
  const timeAgo = formatTimeAgo(comment.createdAt);
  const wasEdited = comment.updatedAt !== comment.createdAt;

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    setSubmitting(true);
    try {
      const reply = await api.comments.create(slug, replyBody, comment.id);
      onReplyAdded(comment.id, reply);
      setReplyBody('');
      setShowReplyForm(false);
      toast.success('Reply posted');
    } catch {
      toast.error('Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBody.trim()) return;
    setSubmitting(true);
    try {
      await api.comments.update(comment.id, editBody);
      onUpdated(comment.id, editBody);
      setEditing(false);
      toast.success('Comment updated');
    } catch {
      toast.error('Failed to update comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this comment?')) return;
    try {
      await api.comments.delete(comment.id);
      onDeleted(comment.id, comment.replies?.length > 0 ? undefined : undefined);
      toast.success('Comment deleted');
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const inputStyle = {
    border: '1px solid hsl(var(--border))',
    backgroundColor: 'hsl(var(--background))',
    color: 'hsl(var(--foreground))',
  };

  return (
    <div className={`flex gap-3 ${depth > 0 ? 'mt-3' : ''}`}>
      {/* Avatar */}
      <div
        className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5"
        style={{ backgroundColor: isDeleted ? 'hsl(var(--muted))' : '#2563eb' }}
      >
        {isDeleted ? '?' : comment.author.name.charAt(0).toUpperCase()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 flex-wrap mb-1">
          {!isDeleted && <span className="text-sm font-semibold">{comment.author.name}</span>}
          <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {timeAgo}
          </span>
          {wasEdited && !isDeleted && (
            <span className="text-xs italic" style={{ color: 'hsl(var(--muted-foreground))' }}>
              (edited)
            </span>
          )}
        </div>

        {/* Body */}
        {editing ? (
          <form onSubmit={handleEdit} className="flex flex-col gap-2 mb-2">
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={3}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none focus:ring-2 focus:ring-blue-500"
              style={inputStyle}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-3 py-1 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setEditBody(comment.body);
                }}
                className="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                style={{
                  border: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--muted-foreground))',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <p
            className="text-sm leading-relaxed mb-1"
            style={{
              color: isDeleted ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))',
              fontStyle: isDeleted ? 'italic' : 'normal',
            }}
          >
            {comment.body}
          </p>
        )}

        {/* Actions */}
        {!isDeleted && !editing && (
          <div className="flex items-center gap-3">
            {user && canReply && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-xs font-medium transition-colors hover:text-blue-600"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              >
                {showReplyForm ? 'Cancel' : 'Reply'}
              </button>
            )}
            {isAuthor && (
              <button
                onClick={() => setEditing(true)}
                className="text-xs font-medium transition-colors hover:text-blue-600"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              >
                Edit
              </button>
            )}
            {(isAuthor || isPrivileged) && (
              <button
                onClick={handleDelete}
                className="text-xs font-medium transition-colors hover:text-red-500"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              >
                Delete
              </button>
            )}
          </div>
        )}

        {/* Reply form */}
        {showReplyForm && user && (
          <form onSubmit={handleReply} className="flex flex-col gap-2 mt-3">
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder={`Reply to ${comment.author.name}…`}
              rows={2}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none focus:ring-2 focus:ring-blue-500"
              style={inputStyle}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting || !replyBody.trim()}
                className="px-3 py-1 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Posting…' : 'Post reply'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowReplyForm(false);
                  setReplyBody('');
                }}
                className="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                style={{
                  border: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--muted-foreground))',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Nested replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 pl-4" style={{ borderLeft: '2px solid hsl(var(--border))' }}>
            {comment.replies.map((reply) => (
              <Comment
                key={reply.id}
                comment={reply}
                slug={slug}
                depth={depth + 1}
                onReplyAdded={onReplyAdded}
                onUpdated={onUpdated}
                onDeleted={onDeleted}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Time ago helper
function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
