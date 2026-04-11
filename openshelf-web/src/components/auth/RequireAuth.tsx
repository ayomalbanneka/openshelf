'use client'

import { useAuthStore } from "@/store/auth.store"
import { useRouter } from "next/navigation"
import React, { useEffect, useState } from "react"

// A component that checks if the user is authenticated before rendering its children
export function RequireAuth({ children }: { children: React.ReactNode }) {
    const { user } = useAuthStore()
    const router = useRouter()
    const [hydrated, setHydrated] = useState(false)

    useEffect(() =>{
        // This is to prevent hydration mismatch error when the user state is initially null on the server
        setHydrated(true)
    },[])

    useEffect(() => {
        if (hydrated && user === null) {
            router.replace('/login')
        }

    }, [hydrated,user, router])

    // Still hydrating — render nothing, don't redirect yet
    if(!hydrated) return null

    // Hydrated but no user — redirect is already in flight
    if (!user) return null

    return <>{children}</>
}