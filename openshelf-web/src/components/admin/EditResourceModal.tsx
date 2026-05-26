'use client'
import { useEffect, useState, useRef } from 'react'
import { http } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import { toast } from '@/lib/toast'
import {
  X, BookOpen, Save, ChevronDown,
  Globe, Tag, User, Calendar, FileText,
  Hash, Building2, Loader2, Check
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────
interface Category {
  id:       string
  name:     string
  children?: Category[]
}

interface AdminResource {
  id:              string
  title:           string
  author?:         string
  description?:    string
  language?:       string
  publisher?:      string
  publicationYear?: number
  pageCount?:      number
  category?:       { id: string; name: string }
}

interface EditForm {
  title:           string
  author:          string
  description:     string
  language:        string
  categoryId:      string
  publisher:       string
  publicationYear: string
  pageCount:       string
}

interface EditResourceModalProps {
  resource:  AdminResource | null
  onClose:   () => void
  onSaved:   () => void
}

// ── Language list ────────────────────────────────────────────
const LANGUAGES: { code: string; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'si', name: 'Sinhala' },
  { code: 'ta', name: 'Tamil' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'es', name: 'Spanish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'zh', name: 'Chinese' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ru', name: 'Russian' },
  { code: 'it', name: 'Italian' },
  { code: 'nl', name: 'Dutch' },
  { code: 'sv', name: 'Swedish' },
  { code: 'pl', name: 'Polish' },
  { code: 'tr', name: 'Turkish' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ms', name: 'Malay' },
]

// ── Custom searchable select ─────────────────────────────────
function SearchableSelect({
  value, onChange, options, placeholder, icon: Icon,
}: {
  value:       string
  onChange:    (val: string) => void
  options:     { value: string; label: string }[]
  placeholder: string
  icon:        React.ElementType
}) {
  const [open, setOpen]     = useState(false)
  const [query, setQuery]   = useState('')
  const ref                 = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)
  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setQuery('') }}
        className="w-full h-11 flex items-center gap-2.5 px-3 rounded-xl text-sm transition-all"
        style={{
          background:   'var(--admin-soft)',
          border:       open ? '1.5px solid #3b82f6' : '1.5px solid var(--admin-border)',
          color:        selected ? 'var(--admin-text)' : 'var(--admin-muted)',
          boxShadow:    open ? '0 0 0 3px rgba(59,130,246,0.1)' : 'none',
        }}
      >
        <Icon className="w-4 h-4 shrink-0" style={{ color: 'var(--admin-muted)' }} />
        <span className="flex-1 text-left truncate">
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className="w-4 h-4 shrink-0 transition-transform"
          style={{
            color:     'var(--admin-muted)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {open && (
        <div
          className="absolute z-50 w-full mt-1.5 rounded-xl overflow-hidden"
          style={{
            background: 'var(--admin-surface)',
            border:     '1.5px solid var(--admin-border)',
            boxShadow:  '0 8px 32px rgba(0,0,0,0.12)',
          }}
        >
          {/* Search input */}
          <div className="p-2" style={{ borderBottom: '1px solid var(--admin-border)' }}>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full h-8 px-3 rounded-lg text-xs outline-none"
              style={{
                background: 'var(--admin-soft)',
                border:     '1px solid var(--admin-border)',
                color:      'var(--admin-text)',
              }}
            />
          </div>

          {/* Options */}
          <div className="max-h-44 overflow-y-auto">
            {/* Clear option */}
            {value && (
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false); setQuery('') }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors"
                style={{ color: 'var(--admin-muted)' }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'var(--admin-soft)')}
                onMouseOut={(e)  => (e.currentTarget.style.background = 'transparent')}
              >
                <X className="w-3.5 h-3.5" />
                Clear selection
              </button>
            )}

            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs" style={{ color: 'var(--admin-muted)' }}>
                No results
              </p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); setQuery('') }}
                  className="w-full flex items-center justify-between gap-2.5 px-3 py-2 text-sm transition-colors"
                  style={{
                    background: opt.value === value ? 'rgba(59,130,246,0.08)' : 'transparent',
                    color:      opt.value === value ? '#3b82f6' : 'var(--admin-text)',
                  }}
                  onMouseOver={(e) => {
                    if (opt.value !== value)
                      e.currentTarget.style.background = 'var(--admin-soft)'
                  }}
                  onMouseOut={(e) => {
                    if (opt.value !== value)
                      e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Field wrapper ────────────────────────────────────────────
function Field({
  label, children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="text-[10px] font-bold uppercase tracking-widest"
        style={{ color: 'var(--admin-muted)' }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}

// ── Input ────────────────────────────────────────────────────
function Input({
  icon: Icon, type = 'text', value, onChange, placeholder,
}: {
  icon:        React.ElementType
  type?:       string
  value:       string
  onChange:    (v: string) => void
  placeholder?: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div
      className="flex items-center gap-2.5 h-11 px-3 rounded-xl transition-all"
      style={{
        background: 'var(--admin-soft)',
        border:     focused ? '1.5px solid #3b82f6' : '1.5px solid var(--admin-border)',
        boxShadow:  focused ? '0 0 0 3px rgba(59,130,246,0.1)' : 'none',
      }}
    >
      <Icon className="w-4 h-4 shrink-0" style={{ color: 'var(--admin-muted)' }} />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm outline-none"
        style={{ color: 'var(--admin-text)' }}
      />
    </div>
  )
}

// ── Main modal ───────────────────────────────────────────────
export function EditResourceModal({ resource, onClose, onSaved }: EditResourceModalProps) {
  const [form, setForm]           = useState<EditForm | null>(null)
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([])
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const [loadingCats, setLoadingCats] = useState(true)
  const overlayRef                = useRef<HTMLDivElement>(null)

  // Initialise form when resource changes
  useEffect(() => {
    if (!resource) return
    setForm({
      title:           resource.title           ?? '',
      author:          resource.author          ?? '',
      description:     resource.description     ?? '',
      language:        resource.language        ?? 'en',
      categoryId:      resource.category?.id    ?? '',
      publisher:       resource.publisher       ?? '',
      publicationYear: String(resource.publicationYear ?? ''),
      pageCount:       String(resource.pageCount       ?? ''),
    })
    setError('')
  }, [resource])

  // Fetch categories from API
  useEffect(() => {
    setLoadingCats(true)
    http.get('/categories')
      .then((r) => {
        const raw: Category[] = r.data.data ?? r.data
        // Flatten parent + children into a single list
        const flat: { value: string; label: string }[] = []
        raw.forEach((cat) => {
          flat.push({ value: cat.id, label: cat.name })
          cat.children?.forEach((child) =>
            flat.push({ value: child.id, label: `  ${child.name}` })
          )
        })
        setCategories(flat)
      })
      .catch(() => {})
      .finally(() => setLoadingCats(false))
  }, [])

  const set = (key: keyof EditForm) => (val: string) =>
    setForm((f) => f ? { ...f, [key]: val } : f)

  const handleSave = async () => {
    if (!resource || !form) return
    setSaving(true)
    setError('')
    try {
      const payload = {
        title: form.title.trim(),
        author: form.author.trim() || undefined,
        description: form.description.trim() || undefined,
        language: form.language,
        categoryId: form.categoryId || undefined,
        publisher: form.publisher.trim() || undefined,
        publicationYear: form.publicationYear.trim() || undefined,
        pageCount: form.pageCount.trim() || undefined,
      }
      await http.patch(`/admin/resources/${resource.id}/edit`, payload)
      toast.success('Resource updated successfully')
      onSaved()
      onClose()
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to save changes'))
    } finally {
      setSaving(false)
    }
  }

  const langOptions = LANGUAGES.map((l) => ({ value: l.code, label: l.name }))

  if (!resource || !form) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div
        className="w-full flex flex-col"
        style={{
          maxWidth:        '580px',
          maxHeight:       '92vh',
          background:      'var(--admin-surface)',
          border:          '1px solid var(--admin-border)',
          borderRadius:    '20px',
          boxShadow:       '0 24px 64px rgba(0,0,0,0.18)',
          overflow:        'hidden',
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center gap-3 px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--admin-border)' }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(59,130,246,0.1)' }}
          >
            <BookOpen className="w-4 h-4" style={{ color: '#3b82f6' }} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold truncate" style={{ color: 'var(--admin-text)' }}>
              Edit resource
            </h2>
            <p className="text-xs truncate" style={{ color: 'var(--admin-muted)' }}>
              {resource.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: 'var(--admin-muted)' }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'var(--admin-soft)')}
            onMouseOut={(e)  => (e.currentTarget.style.background = 'transparent')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">

          {error && (
            <div
              className="flex items-center gap-2.5 text-sm rounded-xl px-3 py-2.5"
              style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}
            >
              <X className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Title */}
          <Field label="Title">
            <Input icon={FileText} value={form.title} onChange={set('title')} placeholder="Resource title" />
          </Field>

          {/* Author + Publisher — side by side */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Author">
              <Input icon={User} value={form.author} onChange={set('author')} placeholder="Author name" />
            </Field>
            <Field label="Publisher">
              <Input icon={Building2} value={form.publisher} onChange={set('publisher')} placeholder="Publisher" />
            </Field>
          </div>

          {/* Publication Year + Page Count — side by side */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Publication Year">
              <Input icon={Calendar} type="number" value={form.publicationYear} onChange={set('publicationYear')} placeholder="e.g. 2023" />
            </Field>
            <Field label="Page Count">
              <Input icon={Hash} type="number" value={form.pageCount} onChange={set('pageCount')} placeholder="e.g. 320" />
            </Field>
          </div>

          {/* Language — searchable select */}
          <Field label="Language">
            <SearchableSelect
              value={form.language}
              onChange={set('language')}
              options={langOptions}
              placeholder="Select language"
              icon={Globe}
            />
          </Field>

          {/* Category — searchable select */}
          <Field label="Category">
            {loadingCats ? (
              <div
                className="h-11 rounded-xl flex items-center gap-2.5 px-3"
                style={{ background: 'var(--admin-soft)', border: '1.5px solid var(--admin-border)' }}
              >
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--admin-muted)' }} />
                <span className="text-sm" style={{ color: 'var(--admin-muted)' }}>Loading categories…</span>
              </div>
            ) : (
              <SearchableSelect
                value={form.categoryId}
                onChange={set('categoryId')}
                options={categories}
                placeholder="Select category"
                icon={Tag}
              />
            )}
          </Field>

          {/* Description */}
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => set('description')(e.target.value)}
              rows={4}
              placeholder="Brief description of this resource…"
              className="w-full rounded-xl px-3 py-3 text-sm outline-none resize-none transition-all"
              style={{
                background: 'var(--admin-soft)',
                border:     '1.5px solid var(--admin-border)',
                color:      'var(--admin-text)',
                lineHeight: '1.6',
              }}
              onFocus={(e)  => {
                e.currentTarget.style.border     = '1.5px solid #3b82f6'
                e.currentTarget.style.boxShadow  = '0 0 0 3px rgba(59,130,246,0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.border     = '1.5px solid var(--admin-border)'
                e.currentTarget.style.boxShadow  = 'none'
              }}
            />
          </Field>
        </div>

        {/* ── Footer ── */}
        <div
          className="flex items-center gap-3 px-6 py-4 shrink-0"
          style={{ borderTop: '1px solid var(--admin-border)' }}
        >
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: 'var(--admin-soft)', color: 'var(--admin-text)' }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = '0.75')}
            onMouseOut={(e)  => (e.currentTarget.style.opacity = '1')}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.title.trim()}
            className="flex-1 h-10 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: '#2563eb', color: '#ffffff' }}
            onMouseOver={(e) => { if (!saving) e.currentTarget.style.background = '#1d4ed8' }}
            onMouseOut={(e)  => { if (!saving) e.currentTarget.style.background = '#2563eb' }}
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
            ) : (
              <><Save className="w-4 h-4" />Save changes</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}