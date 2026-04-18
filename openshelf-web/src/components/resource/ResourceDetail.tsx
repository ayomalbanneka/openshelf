'use client'
import { useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { http } from '@/lib/api'
import { Resource } from '@/types'
import Link from 'next/link'
import { api } from '@/lib/api'

const TYPE_LABELS: Record<string, string> = {
  BOOK: 'Book',
  COURSE: 'Course',
  EXAM_PAPER: 'Exam paper',
  DOCUMENT: 'Document',
  AUDIO: 'Audio',
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ResourceDetail({ resource }: { resource: Resource }) {
  const { user } = useAuthStore()
  const [bookmarked, setBookmarked] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const [lists, setLists] = useState<{ id: string; title: string }[]>([])
  const [showListPicker, setShowListPicker] = useState(false)
  const [savingToList, setSavingToList] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  // Load lists when picker opens
  const openListPicker = async () => {
    if (!user) return
    try {
      const data = await api.lists.getMine()
      setLists(data)
      setShowListPicker(true)
    } catch { }
  }

  const saveToList = async (listId: string) => {
    setSavingToList(true)
    try {
      await api.lists.addItem(listId, resource.id)
      setSavedMsg('Saved!')
      setShowListPicker(false)
      setTimeout(() => setSavedMsg(''), 2000)
    } catch (err: any) {
      setSavedMsg(err?.response?.data?.message || 'Failed to save')
      setTimeout(() => setSavedMsg(''), 2000)
    } finally {
      setSavingToList(false)
    }
  }

  const handleBookmark = async () => {
    if (!user) return
    setBookmarkLoading(true)
    try {
      if (bookmarked) {
        await http.delete(`/resources/${resource.slug}/bookmark`)
        setBookmarked(false)
      } else {
        await http.post(`/resources/${resource.slug}/bookmark`)
        setBookmarked(true)
      }
    } catch {
      // silently fail — we'll add toast notifications later
    } finally {
      setBookmarkLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-8"
        style={{ color: 'hsl(var(--muted-foreground))' }}>
        <Link href="/browse" className="hover:text-blue-600 transition-colors">
          Browse
        </Link>
        <span>/</span>
        <Link
          href={`/browse?category=${resource.category.slug}`}
          className="hover:text-blue-600 transition-colors"
        >
          {resource.category.name}
        </Link>
        <span>/</span>
        <span className="line-clamp-1" style={{ color: 'hsl(var(--foreground))' }}>
          {resource.title}
        </span>
      </nav>

      <div className="flex flex-col md:flex-row gap-10">

        {/* Cover */}
        <div className="shrink-0 w-full md:w-52">
          <div
            className="relative w-full rounded-2xl overflow-hidden flex items-center justify-center text-6xl"
            style={{
              aspectRatio: '3/4',
              backgroundColor: 'hsl(var(--muted))',
              border: '1px solid hsl(var(--border))',
            }}
          >
            {resource.thumbnailUrl ? (
              <img
                src={resource.thumbnailUrl}
                alt={resource.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <span>
                {resource.type === 'BOOK' ? '📖' :
                  resource.type === 'AUDIO' ? '🎧' :
                    resource.type === 'COURSE' ? '🎓' :
                      resource.type === 'EXAM_PAPER' ? '📝' : '📄'}
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col gap-4">

          {/* Type + title */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              {TYPE_LABELS[resource.type]}
            </span>
            <h1 className="text-3xl font-bold mt-1 leading-tight">
              {resource.title}
            </h1>
            {resource.author && (
              <p className="mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                by {resource.author}
              </p>
            )}
          </div>

          {/* Description */}
          {resource.description && (
            <p className="text-sm leading-relaxed"
              style={{ color: 'hsl(var(--muted-foreground))' }}>
              {resource.description}
            </p>
          )}

          {/* Metadata grid */}
          <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            {resource.publisher && (
              <>
                <dt style={{ color: 'hsl(var(--muted-foreground))' }}>Publisher</dt>
                <dd>{resource.publisher}</dd>
              </>
            )}
            {resource.publicationYear && (
              <>
                <dt style={{ color: 'hsl(var(--muted-foreground))' }}>Year</dt>
                <dd>{resource.publicationYear}</dd>
              </>
            )}
            {resource.isbn && (
              <>
                <dt style={{ color: 'hsl(var(--muted-foreground))' }}>ISBN</dt>
                <dd>{resource.isbn}</dd>
              </>
            )}
            {resource.pageCount && (
              <>
                <dt style={{ color: 'hsl(var(--muted-foreground))' }}>Pages</dt>
                <dd>{resource.pageCount}</dd>
              </>
            )}
            {resource.fileSize && (
              <>
                <dt style={{ color: 'hsl(var(--muted-foreground))' }}>File size</dt>
                <dd>{formatBytes(resource.fileSize)}</dd>
              </>
            )}
            <dt style={{ color: 'hsl(var(--muted-foreground))' }}>Language</dt>
            <dd className="uppercase">{resource.language}</dd>
            <dt style={{ color: 'hsl(var(--muted-foreground))' }}>Category</dt>
            <dd>
              <Link
                href={`/browse?category=${resource.category.slug}`}
                className="text-blue-600 hover:underline"
              >
                {resource.category.name}
              </Link>
            </dd>
          </dl>

          {/* Lessons — shown for courses only */}
          {resource.type === 'COURSE' && resource.lessons && resource.lessons.length > 0 && (
            <div className="mt-10">
              <h2 className="text-xl font-bold mb-4">
                Course content
                <span
                  className="text-sm font-normal ml-2"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                  {resource.lessons.length} lessons
                </span>
              </h2>

              <div className="flex flex-col gap-2">
                {resource.lessons.map((lesson, i) => (

                  <a key={lesson.id}
                    href={lesson.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-xl transition-colors hover:bg-blue-50 group"
                    style={{
                      border: '1px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--background))',
                    }}
                  >
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: '#2563eb' }}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium group-hover:text-blue-600 transition-colors">
                        {lesson.title}
                      </p>
                    </div>
                    {lesson.duration && (
                      <span
                        className="text-xs shrink-0"
                        style={{ color: 'hsl(var(--muted-foreground))' }}
                      >
                        {lesson.duration}
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {resource.tags.map(({ tag }) => (
                <span
                  key={tag.id}
                  className="text-xs px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: 'hsl(var(--muted))',
                    color: 'hsl(var(--muted-foreground))',
                    border: '1px solid hsl(var(--border))',
                  }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            {resource.type !== 'COURSE' && (
              <a
                href={resource.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Download
              </a>
            )}

            {user && (
              <button
                onClick={handleBookmark}
                disabled={bookmarkLoading}
                className="px-6 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                style={{
                  border: '1px solid hsl(var(--border))',
                  backgroundColor: bookmarked ? 'hsl(var(--muted))' : 'transparent',
                  color: 'hsl(var(--foreground))',
                }}
              >
                {bookmarked ? 'Bookmarked ✓' : 'Bookmark'}
              </button>
            )}

            {user && (
              <div className="relative">
                <button
                  onClick={openListPicker}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    border: '1px solid hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
                  }}
                >
                  {savedMsg || 'Save to list'}
                </button>

                {showListPicker && (
                  <div
                    className="absolute left-0 top-full mt-1 w-56 rounded-xl py-1 z-20"
                    style={{
                      border: '1px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--background))',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    }}
                  >
                    <div className="flex items-center justify-between px-3 py-2 border-b"
                      style={{ borderColor: 'hsl(var(--border))' }}>
                      <p className="text-xs font-semibold">Save to list</p>
                      <button
                        onClick={() => setShowListPicker(false)}
                        className="text-xs"
                        style={{ color: 'hsl(var(--muted-foreground))' }}
                      >
                        ✕
                      </button>
                    </div>

                    {lists.length === 0 ? (
                      <div className="px-3 py-4 text-center">
                        <p className="text-xs mb-2"
                          style={{ color: 'hsl(var(--muted-foreground))' }}>
                          No lists yet
                        </p>
                        <Link
                          href="/lists"
                          className="text-xs text-blue-600 hover:underline"
                          onClick={() => setShowListPicker(false)}
                        >
                          Create a list
                        </Link>
                      </div>
                    ) : (
                      lists.map((list) => (
                        <button
                          key={list.id}
                          onClick={() => saveToList(list.id)}
                          disabled={savingToList}
                          className="w-full text-left px-3 py-2 text-sm transition-colors hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
                        >
                          {list.title}
                        </button>
                      ))
                    )}

                    <div
                      className="px-3 pt-2 pb-1 border-t"
                      style={{ borderColor: 'hsl(var(--border))' }}
                    >
                      <Link
                        href="/lists"
                        onClick={() => setShowListPicker(false)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Manage lists →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!user && (
              <Link
                href="/login"
                className="px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{
                  border: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--muted-foreground))',
                }}
              >
                Sign in to bookmark
              </Link>
            )}
          </div>

          {/* Stats */}
          <p className="text-xs pt-1"
            style={{ color: 'hsl(var(--muted-foreground))' }}>
            {resource.viewCount.toLocaleString()} views
            {resource._count && ` · ${resource._count.reviews} reviews`}
            {resource._count && ` · ${resource._count.bookmarks} bookmarks`}
          </p>

        </div>
      </div>

      {/* Reviews section */}
      <ReviewsSection slug={resource.slug} />

    </div>
  )
}

// ── Reviews ───────────────────────────────────────────────────

interface Review {
  id: string
  rating: number
  comment?: string
  createdAt: string
  user: { id: string; name: string }
}

function StarRating({
  value,
  onChange,
}: {
  value: number
  onChange?: (v: number) => void
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          className={`text-xl transition-transform ${onChange ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
          style={{ color: star <= value ? '#F59E0B' : 'hsl(var(--border))' }}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function ReviewsSection({ slug }: { slug: string }) {
  const { user } = useAuthStore()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Load reviews on mount
  useState(() => {
    http.get(`/resources/${slug}/reviews`)
      .then((r) => setReviews(r.data))
      .catch(() => { })
      .finally(() => setLoading(false))
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      setError('Please select a rating')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const { data } = await http.post(`/resources/${slug}/reviews`, {
        rating,
        comment,
      })
      setReviews((prev) => [data, ...prev])
      setRating(0)
      setComment('')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-14">
      <h2 className="text-xl font-bold mb-6">Reviews</h2>

      {/* Review form */}
      {user && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 p-5 rounded-2xl flex flex-col gap-4"
          style={{
            border: '1px solid hsl(var(--border))',
            backgroundColor: 'hsl(var(--muted) / 0.4)',
          }}
        >
          <p className="text-sm font-medium">Write a review</p>

          <StarRating value={rating} onChange={setRating} />

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts about this resource… (optional)"
            rows={3}
            className="w-full rounded-xl px-3 py-2 text-sm outline-none resize-none focus:ring-2 focus:ring-blue-500"
            style={{
              border: '1px solid hsl(var(--border))',
              backgroundColor: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
            }}
          />

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="self-start px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit review'}
          </button>
        </form>
      )}

      {/* Review list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-xl animate-pulse"
              style={{ backgroundColor: 'hsl(var(--muted))' }}
            />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm py-8 text-center"
          style={{ color: 'hsl(var(--muted-foreground))' }}>
          No reviews yet.{user ? ' Be the first!' : ' Sign in to leave one.'}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="p-4 rounded-xl"
              style={{
                border: '1px solid hsl(var(--border))',
                backgroundColor: 'hsl(var(--background))',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span
                    className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: '#2563eb' }}
                  >
                    {review.user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="text-sm font-medium">{review.user.name}</span>
                </div>
                <StarRating value={review.rating} />
              </div>
              {review.comment && (
                <p className="text-sm mt-1 leading-relaxed"
                  style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {review.comment}
                </p>
              )}
              <p className="text-xs mt-2"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
                {new Date(review.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}