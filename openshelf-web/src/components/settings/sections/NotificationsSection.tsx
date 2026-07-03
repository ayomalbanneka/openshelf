// src/components/settings/sections/NotificationsSection.tsx
'use client'
import { useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'
import { Loader2 } from 'lucide-react'

const NOTIFICATION_TYPES = [
  { key: 'RESOURCE_PUBLISHED', label: 'Resource published', description: 'When a resource you submitted is approved and published.' },
  { key: 'RESOURCE_REJECTED', label: 'Resource rejected', description: 'When a resource you submitted is rejected with feedback.' },
  { key: 'NEW_FOLLOWER', label: 'New follower', description: 'When someone starts following your profile.' },
  { key: 'COMMENT_ON_RESOURCE', label: 'Comments', description: 'When someone comments on a resource you uploaded.' },
  { key: 'CLUB_INVITE', label: 'Club invites', description: 'When you are invited to join a reading club.' },
]

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`
        relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full 
        transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2
        ${enabled
          ? 'bg-green-500 hover:bg-green-600'
          : 'bg-gray-300 hover:bg-gray-400'
        }
      `}
    >
      <span
        className={`
          inline-block h-5 w-5 rounded-full bg-white shadow-md 
          transform transition-all duration-200 ease-in-out
          ${enabled ? 'translate-x-5' : 'translate-x-0.5'}
          mt-0.5
        `}
      />
    </button>
  )
}

export function NotificationsSection() {
  const { user, setUser } = useAuthStore()
  const rawPrefs = (user?.notificationPrefs ?? {}) as Record<string, boolean>
  const [prefs, setPrefs] = useState<Record<string, boolean>>(rawPrefs)
  const [saving, setSaving] = useState(false)
  const [savingKey, setSavingKey] = useState<string | null>(null)

  const isEnabled = (key: string) => prefs[key] !== false

  const handleToggle = async (key: string, value: boolean) => {
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    setSaving(true)
    setSavingKey(key)

    try {
      await api.notifications.updatePrefs(next)
      setUser({ ...user!, notificationPrefs: next })
    } catch {
      setPrefs(prefs)
      toast.error('Failed to save preferences.')
    } finally {
      setSaving(false)
      setSavingKey(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header with status */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">Notification Preferences</h3>
        {saving && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 size={14} className="animate-spin" />
            Saving changes...
          </div>
        )}
      </div>

      {/* Notification items */}
      {NOTIFICATION_TYPES.map(({ key, label, description }) => {
        const isCurrentlySaving = saving && savingKey === key

        return (
          <div
            key={key}
            className={`
              flex items-center justify-between p-4 rounded-xl
              transition-all duration-200
              ${isCurrentlySaving ? 'opacity-50' : 'hover:shadow-sm'}
              border border-border bg-card
            `}
          >
            <div className="flex-1 pr-4">
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs mt-0.5 text-muted-foreground">
                {description}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {isCurrentlySaving && (
                <Loader2 size={16} className="animate-spin text-muted-foreground" />
              )}
              <Toggle enabled={isEnabled(key)} onChange={(v) => handleToggle(key, v)} />
            </div>
          </div>
        )
      })}
    </div>
  )
}