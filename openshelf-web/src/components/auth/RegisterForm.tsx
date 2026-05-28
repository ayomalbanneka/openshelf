'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { getErrorMessage } from '@/lib/errors'
import { checkPwned } from '@/lib/hibp'
import { PasswordStrength } from '@/components/auth/PasswordStrength'

const schema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm:  z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Passwords do not match',
  path:    ['confirm'],
})

type FormData = z.infer<typeof schema>

const fieldStyle = {
  border:          '1px solid hsl(var(--border))',
  backgroundColor: 'hsl(var(--background))',
  color:           'hsl(var(--foreground))',
}

export function RegisterForm() {
  const router = useRouter()
  const { register: registerUser, isLoading } = useAuthStore()

  const [pwned, setPwned]       = useState<boolean | undefined>(undefined)
  const [checking, setChecking] = useState(false)
  const debounceRef             = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  // Watch the password field for live strength + HIBP check
  const password = useWatch({ control, name: 'password', defaultValue: '' })

  const runPwnedCheck = useCallback((pwd: string) => {
    if (pwd.length < 8) { setPwned(undefined); return }
    clearTimeout(debounceRef.current)
    setChecking(true)
    debounceRef.current = setTimeout(async () => {
      const result = await checkPwned(pwd)
      setPwned(result)
      setChecking(false)
    }, 600)   // 600ms debounce — don't hammer the API on every keystroke
  }, [])

  useEffect(() => {
    runPwnedCheck(password)
    return () => clearTimeout(debounceRef.current)
  }, [password, runPwnedCheck])

  const onSubmit = async (data: FormData) => {
    // Hard block if password is pwned
    if (pwned) {
      setError('password', {
        message: 'This password has appeared in data breaches. Please choose a different one.',
      })
      return
    }

    try {
      await registerUser(data.name, data.email, data.password)
      router.push('/verify-email')
    } catch (err: unknown) {
      setError('root', { message: getErrorMessage(err, 'Something went wrong') })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium">Full name</label>
        <input
          id="name" type="text" autoComplete="name" placeholder="Jane Smith"
          className="h-11 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          style={fieldStyle}
          {...register('name')}
        />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">Email address</label>
        <input
          id="email" type="email" autoComplete="email" placeholder="you@example.com"
          className="h-11 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          style={fieldStyle}
          {...register('email')}
        />
        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
      </div>

      {/* Password + strength meter */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">Password</label>
        <input
          id="password" type="password" autoComplete="new-password"
          placeholder="At least 8 characters"
          className="h-11 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          style={fieldStyle}
          {...register('password')}
        />
        {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}

        {/* Live strength meter */}
        <PasswordStrength password={password} pwned={pwned} checking={checking} />
      </div>

      {/* Confirm password */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirm" className="text-sm font-medium">Confirm password</label>
        <input
          id="confirm" type="password" autoComplete="new-password"
          placeholder="Repeat your password"
          className="h-11 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          style={fieldStyle}
          {...register('confirm')}
        />
        {errors.confirm && <p className="text-xs text-red-500">{errors.confirm.message}</p>}
      </div>

      {/* Root error */}
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
        disabled={isLoading || pwned === true}
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