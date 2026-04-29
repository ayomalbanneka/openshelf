'use client'
import { useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { useRouter } from 'next/navigation'
import { http } from '@/lib/api'
import Link from 'next/link'

export function VerificationBanner() {
  const { user } = useAuthStore()
  const router   = useRouter()
  const [sending, setSending]   = useState(false)
  const [sent, setSent]         = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Only show for logged-in, unverified users
  if (!user || user.isEmailVerified || dismissed) return null

  const handleResend = async () => {
    setSending(true)
    try {
      await http.post('/auth/resend-code')
      setSent(true)
      router.push('/verify-email')
    } catch {
      // silently fail
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      className="w-full px-4 py-2.5 flex items-center justify-between gap-4 text-sm"
      style={{
        backgroundColor: '#fffbeb',
        borderBottom: '1px solid #fcd34d',
      }}
    >
      <div className="flex items-center gap-2">
        <span>⚠️</span>
        <p className="text-amber-800">
          Please verify your email address to unlock all features.
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Link
          href="/verify-email"
          className="text-xs font-medium text-amber-900 hover:underline"
        >
          Enter code
        </Link>
        <button
          onClick={handleResend}
          disabled={sending || sent}
          className="text-xs font-medium text-amber-900 hover:underline disabled:opacity-50"
        >
          {sending ? 'Sending…' : sent ? 'Sent!' : 'Resend code'}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-600 hover:text-amber-800 transition-colors"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  )
}