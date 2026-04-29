'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'

// This component wraps protected pages and redirects unauthenticated users to the login page.
export function RequireAuth({ children, requireVerified = false }: {
  children: React.ReactNode
  requireVerified?: boolean
}) {
  const { user }  = useAuthStore()
  const router    = useRouter()
  const pathname  = usePathname()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => { setHydrated(true) }, [])

  useEffect(() => {
    if (!hydrated) return
    if (!user) {
      router.replace('/login')
      return
    }
    if (requireVerified && !user.isEmailVerified) {
      router.replace('/verify-email')
    }
  }, [hydrated, user, requireVerified, router])

  if (!hydrated) return null
  if (!user) return null
  if (requireVerified && !user.isEmailVerified) return null

  return <>{children}</>
}