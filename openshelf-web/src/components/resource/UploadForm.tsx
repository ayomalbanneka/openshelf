'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { http } from '@/lib/api'
import Image from 'next/image'

interface Category {
  id: string
  name: string
  slug: string
  children: { id: string; name: string; slug: string }[]
}

interface Lesson {
  id: string
  title: string
  duration: string
  file: File | null
}

interface Props {
  categories: Category[]
}

const schema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  type: z.enum(['BOOK', 'COURSE', 'EXAM_PAPER', 'DOCUMENT', 'AUDIO']),
  categoryId: z.string().min(1, 'Category is required'),
  language: z.string().min(1, 'Language is required'),
  description: z.string().optional(),
  author: z.string().optional(),
  publisher: z.string().optional(),
  isbn: z.string().optional(),
  publicationYear: z.string().optional(),
  pageCount: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'si', label: 'Sinhala' },
  { value: 'ta', label: 'Tamil' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'es', label: 'Spanish' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ar', label: 'Arabic' },
]

const TYPES = [
  { value: 'BOOK',       icon: '📖', label: 'Book',       desc: 'Textbooks, novels, references' },
  { value: 'COURSE',     icon: '🎓', label: 'Course',     desc: 'Online courses, tutorials' },
  { value: 'EXAM_PAPER', icon: '📝', label: 'Exam Paper', desc: 'Past papers, model papers' },
  { value: 'DOCUMENT',   icon: '📄', label: 'Document',   desc: 'Articles, guides, notes' },
  { value: 'AUDIO',      icon: '🎵', label: 'Audio',      desc: 'Lectures, podcasts' },
]

const inputStyle = {
  border: '1px solid hsl(var(--border))',
  backgroundColor: 'hsl(var(--background))',
  color: 'hsl(var(--foreground))',
}

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function SectionHeader({ step, title, subtitle }: {
  step: number; title: string; subtitle?: string
}) {
  return (
    <div
      className="flex items-center gap-3 pb-4"
      style={{ borderBottom: '1px solid hsl(var(--border))' }}
    >
      <div
        className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
        style={{ backgroundColor: '#2563eb' }}
      >
        {step}
      </div>
      <h2 className="text-base font-bold">{title}</h2>
      {subtitle && (
        <span className="text-xs ml-auto" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {subtitle}
        </span>
      )}
    </div>
  )
}

// ── Thumbnail uploader ───────────────────────────────────────
function ThumbnailUpload({ thumbnail, setThumbnail }: {
  thumbnail: File | null
  setThumbnail: (f: File | null) => void
}) {
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!thumbnail) {
      setPreview(null)
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setPreview(typeof reader.result === 'string' ? reader.result : null)
    }
    reader.readAsDataURL(thumbnail)
  }, [thumbnail])

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium">Cover image</label>
      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
        Optional. JPG, PNG or WebP — shown as the resource thumbnail.
      </p>

      {preview ? (
        <div className="flex items-center gap-4">
          <Image
            src={preview}
            alt="Thumbnail preview"
            width={80}
            height={96}
            unoptimized
            className="h-24 w-20 object-cover rounded-xl"
            style={{ border: '1px solid hsl(var(--border))' }}
          />
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium truncate max-w-50">{thumbnail!.name}</p>
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {(thumbnail!.size / (1024 * 1024)).toFixed(2)} MB
            </p>
            <button
              type="button"
              onClick={() => setThumbnail(null)}
              className="text-xs text-red-500 hover:underline text-left"
            >
              Remove image
            </button>
          </div>
        </div>
      ) : (
        <label
          className="flex items-center gap-3 cursor-pointer rounded-xl px-4 py-3 transition-colors w-fit"
          style={{
            border: '1px dashed hsl(var(--border))',
            color: 'hsl(var(--muted-foreground))',
          }}
        >
          <div
            className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'hsl(var(--muted))' }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium">Upload cover image</p>
            <p className="text-xs mt-0.5">JPG, PNG, WebP up to 10 MB</p>
          </div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f && f.size <= 10 * 1024 * 1024) setThumbnail(f)
            }}
          />
        </label>
      )}
    </div>
  )
}

// ── Course Lesson Manager ────────────────────────────────────────
function CourseLessons({ lessons, setLessons }: {
  lessons: Lesson[]
  setLessons: (l: Lesson[]) => void
}) {
  const addLesson = () => {
    setLessons([...lessons, {
      id: Math.random().toString(36).slice(2),
      title: '',
      duration: '',
      file: null,
    }])
  }

  const updateLesson = (id: string, key: keyof Lesson, value: any) => {
    setLessons(lessons.map((l) => l.id === id ? { ...l, [key]: value } : l))
  }

  const removeLesson = (id: string) => {
    setLessons(lessons.filter((l) => l.id !== id))
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Course lessons</p>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Add each lesson with its video or audio file and duration
          </p>
        </div>
        <span
          className="text-xs px-2.5 py-1 rounded-full font-medium"
          style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
        >
          {lessons.length} lesson{lessons.length !== 1 ? 's' : ''}
        </span>
      </div>

      {lessons.length > 0 && (
        <div className="flex flex-col gap-2">
          {lessons.map((lesson, idx) => (
            <div
              key={lesson.id}
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid hsl(var(--border))' }}
            >
              {/* Lesson header */}
              <div
                className="flex items-center gap-3 px-4 py-3"
                style={{ backgroundColor: 'hsl(var(--muted))' }}
              >
                <div
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ backgroundColor: '#2563eb' }}
                >
                  {idx + 1}
                </div>
                <input
                  type="text"
                  value={lesson.title}
                  onChange={(e) => updateLesson(lesson.id, 'title', e.target.value)}
                  placeholder={`Lesson ${idx + 1} title…`}
                  className="flex-1 bg-transparent text-sm outline-none font-medium"
                  style={{ color: 'hsl(var(--foreground))' }}
                />
                <input
                  type="text"
                  value={lesson.duration}
                  onChange={(e) => updateLesson(lesson.id, 'duration', e.target.value)}
                  placeholder="MM:SS"
                  className="w-16 bg-transparent text-xs outline-none text-right"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                />
                <button
                  type="button"
                  onClick={() => removeLesson(lesson.id)}
                  className="shrink-0 h-6 w-6 rounded-md flex items-center justify-center transition-colors hover:bg-red-100 hover:text-red-500"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {/* File attach */}
              <div className="px-4 py-3">
                {lesson.file ? (
                  <div className="flex items-center gap-3">
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: '#dcfce7' }}
                    >
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2}>
                        <path d="M9 12l2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{lesson.file.name}</p>
                      <p className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {(lesson.file.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateLesson(lesson.id, 'file', null)}
                      className="text-xs text-red-500 hover:underline shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label
                    className="flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2.5"
                    style={{
                      border: '1px dashed hsl(var(--border))',
                      color: 'hsl(var(--muted-foreground))',
                    }}
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-xs">Click to attach video or audio file</span>
                    <input
                      type="file"
                      accept="video/*,audio/*,.mp4,.mov,.avi,.mkv,.mp3,.wav"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) updateLesson(lesson.id, 'file', f)
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {lessons.length === 0 && (
        <div
          className="text-center py-8 rounded-xl text-sm"
          style={{
            border: '2px dashed hsl(var(--border))',
            color: 'hsl(var(--muted-foreground))',
          }}
        >
          No lessons yet. Add your first lesson below.
        </div>
      )}

      <button
        type="button"
        onClick={addLesson}
        className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors hover:opacity-80"
        style={{ border: '1px dashed hsl(var(--border))', color: '#2563eb' }}
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
        </svg>
        Add lesson
      </button>
    </div>
  )
}

// ── Main Upload Form ─────────────────────────────────────────────
export function UploadForm({ categories }: Props) {
  const router = useRouter()
  const [file, setFile]           = useState<File | null>(null)
  const [thumbnail, setThumbnail] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]   = useState(0)
  const [success, setSuccess]     = useState(false)
  const [lessons, setLessons]     = useState<Lesson[]>([])

  const {
    register, handleSubmit, watch, setValue, setError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'BOOK', language: 'en' },
  })

  const selectedType = watch('type')
  const isCourse = selectedType === 'COURSE'

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 500 * 1024 * 1024) { setFileError('File must be under 500 MB'); return }
    setFileError('')
    setFile(f)
  }

  const clearFile = () => {
    setFile(null)
    setFileError('')
    const input = document.getElementById('file-input') as HTMLInputElement
    if (input) input.value = ''
  }

  const onSubmit = async (data: FormData) => {
    if (isCourse && lessons.length === 0) {
      setFileError('Add at least one lesson')
      return
    }
    if (!isCourse && !file) {
      setFileError('Please select a file')
      return
    }

    setUploading(true)
    setProgress(0)

    try {
      const formData = new FormData()

      // Append text fields
      Object.entries(data).forEach(([key, value]) => {
        if (value) formData.append(key, String(value))
      })

      // Thumbnail (optional, all types)
      if (thumbnail) formData.append('thumbnail', thumbnail)

      if (isCourse) {
        // Courses: send lessons metadata + each lesson file separately
        // No main 'file' field needed
        formData.append('lessons', JSON.stringify(
          lessons.map((l) => ({ title: l.title, duration: l.duration }))
        ))
        lessons.forEach((l, i) => {
          if (l.file) formData.append(`lessonFile_${i}`, l.file)
        })
      } else {
        // All other types: send main file
        formData.append('file', file!)
      }

      await http.post('/resources', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100))
        },
      })

      setSuccess(true)
      setTimeout(() => router.push('/browse'), 2500)
    } catch (err: any) {
      setError('root', { message: err?.response?.data?.message || 'Upload failed' })
    } finally {
      setUploading(false)
    }
  }

  // ── Success ──────────────────────────────────────────────────
  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="h-16 w-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#dcfce7' }}>
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2.5}>
            <path d="M9 12l2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-green-600 mb-1">Upload successful!</h2>
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Your resource has been submitted and is pending review.
          </p>
          <p className="text-xs mt-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Redirecting to browse page…
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">

      {/* ── Step 1: Type ───────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <SectionHeader step={1} title="What are you sharing?" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TYPES.map((t) => {
            const active = selectedType === t.value
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setValue('type', t.value as FormData['type'])}
                className="flex items-start gap-3 p-4 rounded-xl text-left transition-all"
                style={{
                  border: `2px solid ${active ? '#2563eb' : 'hsl(var(--border))'}`,
                  backgroundColor: active ? '#eff6ff' : 'hsl(var(--background))',
                }}
              >
                <span className="text-2xl leading-none mt-0.5">{t.icon}</span>
                <div>
                  <p className="font-semibold text-sm leading-tight"
                    style={{ color: active ? '#1d4ed8' : 'hsl(var(--foreground))' }}>
                    {t.label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {t.desc}
                  </p>
                </div>
                {active && (
                  <div
                    className="ml-auto h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: '#2563eb' }}
                  >
                    <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}>
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* ── Step 2: File / Lessons ─────────────────────── */}
      <section className="flex flex-col gap-4">
        <SectionHeader
          step={2}
          title={isCourse ? 'Add course content' : 'Upload your file'}
          subtitle={isCourse ? 'Upload each lesson file separately' : undefined}
        />

        {isCourse ? (
          <CourseLessons lessons={lessons} setLessons={setLessons} />
        ) : !file ? (
          <label
            className="flex flex-col items-center justify-center gap-3 rounded-2xl p-12 text-center cursor-pointer"
            style={{ border: '2px dashed hsl(var(--border))', backgroundColor: 'hsl(var(--muted))' }}
          >
            <input id="file-input" type="file" onChange={handleFile} className="hidden"
              accept=".pdf,.doc,.docx,.epub,.mp3,.wav,.ogg,.m4a" />
            <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#eff6ff' }}>
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#2563eb" strokeWidth={1.5}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm">Click to upload a file</p>
              <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                PDF, Word, EPUB, MP3, WAV — up to 500 MB
              </p>
            </div>
          </label>
        ) : (
          <div className="flex items-center gap-4 p-4 rounded-xl"
            style={{ border: '1px solid #86efac', backgroundColor: '#f0fdf4' }}>
            <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#dcfce7' }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: '#14532d' }}>
                {file.name}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#16a34a' }}>
                {(file.size / (1024 * 1024)).toFixed(2)} MB — ready to upload
              </p>
            </div>
            <button type="button" onClick={clearFile} className="text-xs text-red-500 hover:underline shrink-0">
              Remove
            </button>
          </div>
        )}

        {fileError && (
          <p className="text-xs text-red-500 flex items-center gap-1.5">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
            </svg>
            {fileError}
          </p>
        )}
      </section>

      {/* ── Step 3: Cover image ────────────────────────── */}
      <section className="flex flex-col gap-4">
        <SectionHeader step={3} title="Cover image" subtitle="Optional" />
        <ThumbnailUpload thumbnail={thumbnail} setThumbnail={setThumbnail} />
      </section>

      {/* ── Step 4: Basic info ─────────────────────────── */}
      <section className="flex flex-col gap-4">
        <SectionHeader step={4} title="Basic information" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Title" required error={errors.title?.message}>
              <input
                {...register('title')}
                placeholder="e.g. Introduction to Algorithms"
                className="h-10 rounded-xl px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                style={inputStyle}
              />
            </Field>
          </div>

          <Field label="Category" required error={errors.categoryId?.message}>
            <select {...register('categoryId')}
              className="h-10 rounded-xl px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              style={inputStyle}>
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <optgroup key={cat.id} label={cat.name}>
                  <option value={cat.id}>{cat.name}</option>
                  {cat.children?.map((child) => (
                    <option key={child.id} value={child.id}>&nbsp;&nbsp;{child.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>

          <Field label="Language" required>
            <select {...register('language')}
              className="h-10 rounded-xl px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              style={inputStyle}>
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </Field>

          <div className="sm:col-span-2">
            <Field label="Description">
              <textarea {...register('description')} rows={3}
                placeholder="Tell us more about this resource…"
                className="rounded-xl px-3 py-2 text-sm outline-none resize-none focus:ring-2 focus:ring-blue-500 transition-all w-full"
                style={inputStyle}
              />
            </Field>
          </div>
        </div>
      </section>

      {/* ── Step 5: Additional details ─────────────────── */}
      {['BOOK', 'COURSE', 'EXAM_PAPER', 'DOCUMENT'].includes(selectedType) && (
        <section className="flex flex-col gap-4">
          <SectionHeader step={5} title="Additional details" subtitle="Optional" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {['BOOK', 'COURSE', 'DOCUMENT'].includes(selectedType) && (
              <Field label="Author">
                <input {...register('author')} placeholder="e.g. Thomas H. Cormen"
                  className="h-10 rounded-xl px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  style={inputStyle} />
              </Field>
            )}
            {['BOOK', 'DOCUMENT'].includes(selectedType) && (
              <Field label="Publisher">
                <input {...register('publisher')} placeholder="e.g. MIT Press"
                  className="h-10 rounded-xl px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  style={inputStyle} />
              </Field>
            )}
            {selectedType === 'BOOK' && (
              <Field label="ISBN">
                <input {...register('isbn')} placeholder="e.g. 978-0-262-03384-8"
                  className="h-10 rounded-xl px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  style={inputStyle} />
              </Field>
            )}
            {['BOOK', 'DOCUMENT', 'COURSE'].includes(selectedType) && (
              <Field label="Publication year">
                <input {...register('publicationYear')} type="number"
                  placeholder={`e.g. ${new Date().getFullYear()}`}
                  min="1900" max={new Date().getFullYear()}
                  className="h-10 rounded-xl px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  style={inputStyle} />
              </Field>
            )}
            {['BOOK', 'DOCUMENT', 'EXAM_PAPER'].includes(selectedType) && (
              <Field label="Page count">
                <input {...register('pageCount')} type="number" placeholder="e.g. 256" min="1"
                  className="h-10 rounded-xl px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  style={inputStyle} />
              </Field>
            )}
          </div>
        </section>
      )}

      {/* ── Progress ───────────────────────────────────── */}
      {uploading && (
        <div className="flex flex-col gap-3 p-4 rounded-xl"
          style={{ border: '1px solid #93c5fd', backgroundColor: '#eff6ff' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              <span className="text-sm font-medium text-blue-700">Uploading…</span>
            </div>
            <span className="text-sm font-bold text-blue-700">{progress}%</span>
          </div>
          <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ backgroundColor: '#bfdbfe' }}>
            <div className="h-1.5 rounded-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }}/>
          </div>
        </div>
      )}

      {/* ── Root error ─────────────────────────────────── */}
      {errors.root && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ border: '1px solid #fca5a5', backgroundColor: '#fef2f2' }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={2} className="shrink-0">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
          </svg>
          <p className="text-sm text-red-600">{errors.root.message}</p>
        </div>
      )}

      {/* ── Submit ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 pt-6"
        style={{ borderTop: '1px solid hsl(var(--border))' }}>
        <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Your upload will be reviewed by moderators before appearing publicly.
        </p>
        <button
          type="submit"
          disabled={uploading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {uploading ? `Uploading ${progress}%…` : 'Upload resource'}
        </button>
      </div>

    </form>
  )
}