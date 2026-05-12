'use client'
import { useRouter, usePathname } from 'next/navigation'
import { useRef } from 'react'

export function ClubSearch({ defaultValue }: { defaultValue?: string }) {
  const router   = useRouter()
  const pathname = usePathname()
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams()
      if (q) params.set('search', q)
      router.push(`${pathname}?${params.toString()}`)
    }, 400)
  }

  return (
    <input
      type="text"
      defaultValue={defaultValue}
      onChange={handleChange}
      placeholder="Search clubs…"
      className="h-9 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 w-56 transition-all"
      style={{
        border:          '1px solid hsl(var(--border))',
        backgroundColor: 'hsl(var(--background))',
        color:           'hsl(var(--foreground))',
      }}
    />
  )
}