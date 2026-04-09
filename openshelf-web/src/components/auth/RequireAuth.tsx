'use client'

import { useAuthStore } from "@/store/auth.store"
import { useRouter } from "next/navigation"
import React, { useEffect } from "react"

// A component that checks if the user is authenticated before rendering its children
export function RequireAuth({ children }: { children: React.ReactNode }) {
    const { user } = useAuthStore()
    const router = useRouter()

    useEffect(() => {
        if (user === null) {
            router.replace('/login')
        }

    }, [user, router])

    if (!user) return null

    return <>{children}</>
}