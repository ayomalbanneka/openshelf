'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { http } from '@/lib/api'
import { X, Upload, Check, AlertCircle, FileText } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  children: { id: string; name: string; slug: string }[]
}

interface Props {
  categories: Category[]
}

const schema = z.object({
  title:           z.string().min(2, 'Title must be at least 2 characters'),
  type:            z.enum(['BOOK', 'COURSE', 'EXAM_PAPER', 'DOCUMENT', 'AUDIO']),
  categoryId:      z.string().min(1, 'Category is required'),
  language:        z.string().min(1, 'Language is required'),
  description:     z.string().optional(),
  author:          z.string().optional(),
  publisher:       z.string().optional(),
  isbn:            z.string().optional(),
  publicationYear: z.string().optional(),
  pageCount:       z.string().optional(),
})

type FormData = z.infer<typeof schema>

const RESOURCE_TYPES = [
  { value: 'BOOK',       label: '📖 Book',       description: 'Textbooks, novels, references' },
  { value: 'COURSE',     label: '🎓 Course',     description: 'Online courses, tutorials' },
  { value: 'EXAM_PAPER', label: '📝 Exam Paper', description: 'Past papers, model papers' },
  { value: 'DOCUMENT',   label: '📄 Document',   description: 'Articles, guides, notes' },
  { value: 'AUDIO',      label: '🎵 Audio',      description: 'Lectures, podcasts' },
]

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

const inputClass = `
  w-full h-10 rounded-lg px-3 text-sm outline-none transition-all
  focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
`

const inputStyle = {
  border: '1px solid hsl(var(--border))',
  backgroundColor: 'hsl(var(--background))',
  color: 'hsl(var(--foreground))',
}

const labelClass = 'text-sm font-semibold block mb-2 text-foreground'

export function UploadForm({ categories }: Props) {
  const router = useRouter()
  const [file, setFile]           = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]   = useState(0)
  const [success, setSuccess]     = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'BOOK', language: 'en' },
  })

  const selectedType = watch('type')
  const selectedLanguage = watch('language')

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 100 * 1024 * 1024) {
      setFileError('File must be under 100 MB')
      return
    }
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
    if (!file) {
      setFileError('Please select a file')
      return
    }

    setUploading(true)
    setProgress(0)

    try {
      const formData = new FormData()

      // Append all text fields
      Object.entries(data).forEach(([key, value]) => {
        if (value) formData.append(key, value)
      })

      // Append the file
      formData.append('file', file)

      await http.post('/resources', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) {
            setProgress(Math.round((e.loaded / e.total) * 100))
          }
        },
      })

      setSuccess(true)
      setTimeout(() => router.push('/browse'), 2500)
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Upload failed'
      setError('root', { message })
    } finally {
      setUploading(false)
    }
  }

  if (success) {
    return (
      <div
        className="rounded-2xl p-8 text-center border-2"
        style={{
          borderColor: '#10b981',
          backgroundColor: 'hsl(var(--muted))',
        }}
      >
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center animate-pulse" style={{
            backgroundColor: 'hsl(var(--border))',
          }}>
            <Check className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2 text-green-600">Upload successful!</h2>
        <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Your resource has been submitted and is pending review by our moderators.
        </p>
        <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Redirecting to browse page…
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">

      {/* ── STEP 1: Resource Type ──────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">1</div>
          <h2 className="text-lg font-bold">What are you sharing?</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {RESOURCE_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setValue('type', t.value as FormData['type'])}
              className="p-4 rounded-xl border-2 transition-all text-left"
              style={{
                borderColor: selectedType === t.value ? '#2563eb' : 'hsl(var(--border))',
                backgroundColor: selectedType === t.value ? 'hsl(var(--muted))' : 'transparent',
              }}
            >
              <div className="font-semibold text-foreground">{t.label}</div>
              <div className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {t.description}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── STEP 2: File Upload ───────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">2</div>
          <h2 className="text-lg font-bold">Upload your file</h2>
        </div>

        {!file ? (
          <div
            className="relative flex flex-col items-center justify-center gap-3 rounded-2xl p-12 text-center cursor-pointer transition-all"
            style={{
              border: '2px dashed hsl(var(--border))',
              backgroundColor: 'hsl(var(--muted))',
            }}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              onChange={handleFile}
              className="hidden"
              accept=".pdf,.doc,.docx,.epub,.mp3,.wav,.ogg,.m4a"
            />
            <Upload className="w-10 h-10 text-blue-600" />
            <div>
              <p className="font-semibold text-foreground">Click to upload</p>
              <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                PDF, Word, EPUB, MP3, WAV — up to 100 MB
              </p>
            </div>
          </div>
        ) : (
          <div
            className="flex items-center gap-4 p-4 rounded-xl border"
            style={{
              borderColor: '#10b981',
              backgroundColor: 'hsl(var(--muted))',
            }}
          >
            <FileText className="w-10 h-10 text-green-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{file.name}</p>
              <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="p-1.5 rounded-lg transition-colors shrink-0"
              style={{
                backgroundColor: 'hsl(var(--border))',
              }}
            >
              <X className="w-5 h-5 text-red-600" />
            </button>
          </div>
        )}
        {fileError && (
          <div className="flex gap-2 p-3 border rounded-lg" style={{
            borderColor: '#ef4444',
            backgroundColor: 'hsl(var(--muted))',
          }}>
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs text-red-600">{fileError}</p>
          </div>
        )}
      </section>

      {/* ── STEP 3: Basic Information ──────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">3</div>
          <h2 className="text-lg font-bold">Basic information</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Title */}
          <div className="sm:col-span-2">
            <label className={labelClass}>Title <span className="text-red-500">*</span></label>
            <input
              {...register('title')}
              placeholder="e.g. Introduction to Algorithms"
              className={inputClass}
              style={inputStyle}
            />
            {errors.title && <Err msg={errors.title.message} />}
          </div>

          {/* Category */}
          <div>
            <label className={labelClass}>Category <span className="text-red-500">*</span></label>
            <select
              {...register('categoryId')}
              className={inputClass}
              style={inputStyle}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <optgroup key={cat.id} label={cat.name}>
                  <option value={cat.id}>{cat.name}</option>
                  {cat.children.map((child) => (
                    <option key={child.id} value={child.id}>
                      &nbsp;&nbsp;{child.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {errors.categoryId && <Err msg={errors.categoryId.message} />}
          </div>

          {/* Language */}
          <div>
            <label className={labelClass}>Language <span className="text-red-500">*</span></label>
            <select
              {...register('language')}
              className={inputClass}
              style={inputStyle}
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <label className={labelClass}>Description</label>
            <textarea
              {...register('description')}
              rows={4}
              placeholder="Tell us more about this resource…"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
              style={inputStyle}
            />
          </div>
        </div>
      </section>

      {/* ── STEP 4: Additional Details ─────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">4</div>
          <h2 className="text-lg font-bold">Additional details</h2>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">(Optional based on type)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Author — only for books, courses, documents */}
          {['BOOK', 'COURSE', 'DOCUMENT'].includes(selectedType) && (
            <div>
              <label className={labelClass}>Author</label>
              <input
                {...register('author')}
                placeholder="e.g. Thomas H. Cormen"
                className={inputClass}
                style={inputStyle}
              />
            </div>
          )}

          {/* Publisher — books and documents */}
          {['BOOK', 'DOCUMENT'].includes(selectedType) && (
            <div>
              <label className={labelClass}>Publisher</label>
              <input
                {...register('publisher')}
                placeholder="e.g. MIT Press"
                className={inputClass}
                style={inputStyle}
              />
            </div>
          )}

          {/* ISBN — books only */}
          {selectedType === 'BOOK' && (
            <div>
              <label className={labelClass}>ISBN</label>
              <input
                {...register('isbn')}
                placeholder="e.g. 978-0-262-03384-8"
                className={inputClass}
                style={inputStyle}
              />
            </div>
          )}

          {/* Publication year */}
          {['BOOK', 'DOCUMENT', 'COURSE'].includes(selectedType) && (
            <div>
              <label className={labelClass}>Publication year</label>
              <input
                {...register('publicationYear')}
                type="number"
                placeholder="e.g. 2009"
                min="1900"
                max={new Date().getFullYear()}
                className={inputClass}
                style={inputStyle}
              />
            </div>
          )}

          {/* Page count */}
          {['BOOK', 'DOCUMENT', 'EXAM_PAPER'].includes(selectedType) && (
            <div>
              <label className={labelClass}>Page count</label>
              <input
                {...register('pageCount')}
                type="number"
                placeholder="e.g. 256"
                min="1"
                className={inputClass}
                style={inputStyle}
              />
            </div>
          )}
        </div>
      </section>

      {/* ── Upload progress ───────────────────────────── */}
      {uploading && (
        <div className="flex flex-col gap-3 p-4 border rounded-xl" style={{
          borderColor: '#3b82f6',
          backgroundColor: 'hsl(var(--muted))',
        }}>
          <div className="flex items-center gap-2">
            <div className="animate-spin">
              <Upload className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Uploading your resource…</span>
          </div>
          <div
            className="w-full rounded-full h-2 overflow-hidden"
            style={{ backgroundColor: 'hsl(var(--border))' }}
          >
            <div
              className="h-2 rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-right" style={{ color: 'hsl(var(--foreground))' }}>{progress}% complete</p>
        </div>
      )}

      {/* ── Root error ────────────────────────────────── */}
      {errors.root && (
        <div className="flex gap-3 p-4 border rounded-xl" style={{
          borderColor: '#ef4444',
          backgroundColor: 'hsl(var(--muted))',
        }}>
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{errors.root.message}</p>
        </div>
      )}

      {/* ── Submit ────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-6 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="flex-1">
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Your upload will be reviewed by moderators before appearing publicly.
          </p>
        </div>
        <button
          type="submit"
          disabled={uploading}
          className="ml-4 px-8 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Upload className="w-5 h-5" />
          {uploading ? `Uploading ${progress}%…` : 'Upload resource'}
        </button>
      </div>

    </form>
  )
}

// ── Small helpers ─────────────────────────────────────────────

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-500 mt-1">{msg}</p> : null
}
