import { RequireAuth } from '@/components/auth/RequireAuth'
import { SettingsForm } from '@/components/settings/SettingsForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Settings' }

export default function SettingsPage() {
  return (
    <RequireAuth>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Settings</h1>
          <p style={{ color: 'hsl(var(--muted-foreground))' }}>
            Manage your profile and account preferences.
          </p>
        </div>
        <SettingsForm />
      </div>
    </RequireAuth>
  )
}