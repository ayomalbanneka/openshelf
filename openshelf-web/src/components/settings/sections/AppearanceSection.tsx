// src/components/settings/sections/AppearanceSection.tsx
'use client'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'

const THEMES = [
  { value: 'light',  label: 'Light',  icon: Sun     },
  { value: 'dark',   label: 'Dark',   icon: Moon    },
  { value: 'system', label: 'System', icon: Monitor },
] as const

export function AppearanceSection() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3">
        {THEMES.map(({ value, label, icon: Icon }) => {
          const active = theme === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className="flex flex-col items-center gap-3 p-5 rounded-xl transition-all"
              style={{
                border:     active ? '1.5px solid hsl(var(--primary))' : '1px solid hsl(var(--border))',
                background: active ? 'hsl(var(--primary) / 0.06)' : 'hsl(var(--card))',
                color:      active ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
              }}
            >
              <Icon size={22} />
              <span className="text-sm font-medium">{label}</span>
            </button>
          )
        })}
      </div>
      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
        System follows your device's appearance setting.
      </p>
    </div>
  )
}