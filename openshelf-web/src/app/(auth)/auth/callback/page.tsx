'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'

export default function OAuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fetchMe = useAuthStore((s) => s.fetchMe)
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const error = searchParams.get('error')
    if (error) {
      const message = error === 'account_exists'
        ? 'An account with that email already exists. Please log in with your password.'
        : 'Sign-in failed. Please try again.'
      router.replace(`/login?error=${encodeURIComponent(message)}`)
      return
    }

    fetchMe()
      .then(() => router.replace('/dashboard'))
      .catch(() => router.replace('/login?error=Sign-in%20failed.%20Please%20try%20again.'))
  }, [router, searchParams, fetchMe])

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
      <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Signing you in…</p>
    </div>
  )
}