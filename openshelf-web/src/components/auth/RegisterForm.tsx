'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],
})

type FormData = z.infer<typeof schema>

const fieldStyle = {
  border: '1px solid hsl(var(--border))',
  backgroundColor: 'hsl(var(--background))',
  color: 'hsl(var(--foreground))',
}

const FIELDS = [
  { id: 'name', label: 'Full name', type: 'text', auto: 'name', placeholder: 'Jane Smith' },
  { id: 'email', label: 'Email address', type: 'email', auto: 'email', placeholder: 'you@example.com' },
  { id: 'password', label: 'Password', type: 'password', auto: 'new-password', placeholder: 'At least 8 characters' },
  { id: 'confirm', label: 'Confirm password', type: 'password', auto: 'new-password', placeholder: 'Repeat your password' },
]

export function RegisterForm() {
  const router = useRouter()
  const { register: registerUser, isLoading } = useAuthStore()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      await registerUser(data.name, data.email, data.password)
      // Always go to verify-email after register
      router.push('/verify-email')
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Something went wrong'
      setError('root', { message })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

      {FIELDS.map(({ id, label, type, auto, placeholder }) => (
        <div key={id} className="flex flex-col gap-1.5">
          <label htmlFor={id} className="text-sm font-medium">{label}</label>
          <input
            id={id}
            type={type}
            autoComplete={auto}
            placeholder={placeholder}
            className="h-11 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            style={fieldStyle}
            {...register(id as keyof FormData)}
          />
          {errors[id as keyof FormData] && (
            <p className="text-xs text-red-500">{errors[id as keyof FormData]?.message}</p>
          )}
        </div>
      ))}

      {errors.root && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
            <circle cx="8" cy="8" r="7" stroke="#ef4444" strokeWidth="1.5" />
            <path d="M8 5v3.5M8 11h.01" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p className="text-sm text-red-600">{errors.root.message}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="h-11 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
      >
        {isLoading && (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
        {isLoading ? 'Creating account…' : 'Create account'}
      </button>

    </form>
  )
}