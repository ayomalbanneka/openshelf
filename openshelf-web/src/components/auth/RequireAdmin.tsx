'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user }  = useAuthStore()
  const router    = useRouter()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => { setHydrated(true) }, [])

  useEffect(() => {
    if (!hydrated) return
    if (!user) {
      router.replace('/login')
    } else if (user.role !== 'ADMIN' && user.role !== 'MODERATOR') {
      router.replace('/')
    }
  }, [hydrated, user, router])

  if (!hydrated) return null
  if (!user) return null
  if (user.role !== 'ADMIN' && user.role !== 'MODERATOR') return null

  return <>{children}</>
}