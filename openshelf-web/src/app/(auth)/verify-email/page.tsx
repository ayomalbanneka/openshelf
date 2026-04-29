'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { http } from '@/lib/api'

export default function VerifyEmailPage() {
  const { user, setUser } = useAuthStore()
  const router = useRouter()
  const [code, setCode]       = useState(['', '', '', '', '', ''])
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent]   = useState(false)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // If already verified, redirect to browse
    if (user?.isEmailVerified) router.replace('/browse')
  }, [user, router])

  const handleChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return  // digits only
    const next = [...code]
    next[i] = val.slice(-1)
    setCode(next)
    if (val && i < 5) inputs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      inputs.current[i - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setCode(pasted.split(''))
      inputs.current[5]?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const fullCode = code.join('')
    if (fullCode.length < 6) {
      setError('Enter all 6 digits')
      return
    }
    setLoading(true)
    setError('')
    try {
      await http.post('/auth/verify-email', { code: fullCode })
      // Update local user state
      if (user) setUser({ ...user, isEmailVerified: true })
      router.replace('/browse')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid code')
      setCode(['', '', '', '', '', ''])
      inputs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      await http.post('/auth/resend-code')
      setResent(true)
      setTimeout(() => setResent(false), 5000)
    } catch {
      setError('Failed to resend code')
    } finally {
      setResending(false)
    }
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <div className="text-4xl mb-3">📧</div>
        <h1 className="text-2xl font-bold mb-1">Check your email</h1>
        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
          We sent a 6-digit code to{' '}
          <span className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>
            {user?.email}
          </span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* 6-digit code input */}
        <div className="flex gap-2 justify-center" onPaste={handlePaste}>
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-12 h-14 text-center text-xl font-bold rounded-xl outline-none transition-all focus:ring-2 focus:ring-blue-500"
              style={{
                border: `2px solid ${digit ? '#2563eb' : 'hsl(var(--border))'}`,
                backgroundColor: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
              }}
            />
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        {resent && (
          <p className="text-sm text-green-600 text-center">
            ✓ New code sent to your email
          </p>
        )}

        <button
          type="submit"
          disabled={loading || code.join('').length < 6}
          className="h-10 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Verifying…' : 'Verify email'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm"
        style={{ color: 'hsl(var(--muted-foreground))' }}>
        Didn&apos;t receive it?{' '}
        <button
          onClick={handleResend}
          disabled={resending}
          className="text-blue-600 hover:underline font-medium disabled:opacity-50"
        >
          {resending ? 'Sending…' : 'Resend code'}
        </button>
      </div>
    </div>
  )
}