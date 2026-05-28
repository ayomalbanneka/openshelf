'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { useHydrated } from '@/hooks/useHydrated'

// This component wraps protected pages and redirects unauthenticated users to the login page.
export function RequireAuth({ children, requireVerified = false }: {
  children: React.ReactNode
  requireVerified?: boolean
}) {
  const { user }  = useAuthStore()
  const router    = useRouter()
  const hydrated = useHydrated()

  useEffect(() => {
    if (!hydrated) return
    if (!user) {
      router.replace('/login')
      return
    }
    if (requireVerified && !user.isEmailVerified) {
      router.replace('/verify-email?from=upload')
    }
  }, [hydrated, user, requireVerified, router])

  if (!hydrated) return null
  if (!user) return null
  if (requireVerified && !user.isEmailVerified) return null

  return <>{children}</>
}