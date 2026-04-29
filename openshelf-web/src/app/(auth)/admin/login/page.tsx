'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { http } from '@/lib/api'
import Link from 'next/link'

export default function AdminLoginPage() {
  const router  = useRouter()
  const { setUser } = useAuthStore()

  const [step, setStep]         = useState<'credentials' | 'code'>('credentials')
  const [userId, setUserId]     = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode]         = useState(['', '', '', '', '', ''])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const inputStyle = {
    border: '1px solid hsl(var(--border))',
    backgroundColor: 'hsl(var(--background))',
    color: 'hsl(var(--foreground))',
  }

  const handleCodeChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return
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

  // Step 1 — credentials
  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await http.post('/auth/admin/login', { email, password })
      setUserId(data.userId)
      setStep('code')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  // Step 2 — 2FA code
  const handleCode = async (e: React.FormEvent) => {
    e.preventDefault()
    const fullCode = code.join('')
    if (fullCode.length < 6) { setError('Enter all 6 digits'); return }
    setLoading(true)
    setError('')
    try {
      const { data } = await http.post('/auth/admin/verify', {
        userId,
        code: fullCode,
      })
      localStorage.setItem('accessToken',  data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      setUser(data.user)
      router.replace('/admin')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid or expired code')
      setCode(['', '', '', '', '', ''])
      inputs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 text-center">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: '#1e3a8a' }}
        >
          <span className="text-2xl">🛡️</span>
        </div>
        <h1 className="text-2xl font-bold mb-1">Admin access</h1>
        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {step === 'credentials'
            ? 'Sign in with your admin credentials.'
            : 'Enter the 6-digit code sent to your email.'}
        </p>
      </div>

      {/* Step 1 — Credentials */}
      {step === 'credentials' && (
        <form onSubmit={handleCredentials} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@openshelf.dev"
              className="h-10 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              style={inputStyle}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-10 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              style={inputStyle}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-10 rounded-xl font-medium text-sm text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#1e3a8a' }}
          >
            {loading ? 'Verifying…' : 'Continue →'}
          </button>
        </form>
      )}

      {/* Step 2 — 2FA code */}
      {step === 'code' && (
        <form onSubmit={handleCode} className="flex flex-col gap-6">
          <div
            className="text-center text-sm p-3 rounded-lg"
            style={{
              backgroundColor: '#eff6ff',
              color: '#1e40af',
              border: '1px solid #bfdbfe',
            }}
          >
            Code sent to your email. Check your inbox.
          </div>

          <div className="flex gap-2 justify-center" onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-12 h-14 text-center text-xl font-bold rounded-xl outline-none focus:ring-2 focus:ring-blue-800"
                style={{
                  border: `2px solid ${digit ? '#1e3a8a' : 'hsl(var(--border))'}`,
                  backgroundColor: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                }}
              />
            ))}
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || code.join('').length < 6}
            className="h-10 rounded-xl font-medium text-sm text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#1e3a8a' }}
          >
            {loading ? 'Verifying…' : 'Sign in to admin'}
          </button>

          <button
            type="button"
            onClick={() => { setStep('credentials'); setCode(['','','','','','']); setError('') }}
            className="text-sm text-center hover:underline"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            ← Use different credentials
          </button>
        </form>
      )}

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="text-sm hover:underline"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          Regular user? Sign in here
        </Link>
      </div>
    </div>
  )
}