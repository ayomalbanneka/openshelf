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

const inputClass = `
  w-full h-10 rounded-lg px-3 text-sm outline-none transition-all
  border focus:ring-2 focus:ring-blue-500
`

const inputStyle = {
  border: '1px solid hsl(var(--border))',
  backgroundColor: 'hsl(var(--background))',
  color: 'hsl(var(--foreground))',
}

const fields = [
  { id: 'name',     label: 'Full name',        type: 'text',     auto: 'name',         placeholder: 'Jane Smith' },
  { id: 'email',    label: 'Email',             type: 'email',    auto: 'email',        placeholder: 'you@example.com' },
  { id: 'password', label: 'Password',          type: 'password', auto: 'new-password', placeholder: '8+ characters' },
  { id: 'confirm',  label: 'Confirm password',  type: 'password', auto: 'new-password', placeholder: 'Repeat your password' },
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
      router.push('/browse')
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Something went wrong'
      setError('root', { message })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

      {fields.map(({ id, label, type, auto, placeholder }) => (
        <div key={id} className="flex flex-col gap-1.5">
          <label htmlFor={id} className="text-sm font-medium">
            {label}
          </label>
          <input
            id={id}
            type={type}
            autoComplete={auto}
            placeholder={placeholder}
            style={inputStyle}
            className={inputClass}
            {...register(id as keyof FormData)}
          />
          {errors[id as keyof FormData] && (
            <p className="text-xs text-red-500">
              {errors[id as keyof FormData]?.message}
            </p>
          )}
        </div>
      ))}

      {errors.root && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
          {errors.root.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="h-10 rounded-lg bg-blue-600 text-white font-medium text-sm
          hover:bg-blue-700 transition-colors disabled:opacity-50
          disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading && (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
        {isLoading ? 'Creating account...' : 'Create account'}
      </button>

    </form>
  )
}