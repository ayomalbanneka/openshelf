import { RequireAuth } from '@/components/auth/RequireAuth'
import { SettingsShell } from '@/components/settings/SettingsShell'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Settings' }

export default function SettingsPage() {
  return (
    <RequireAuth>
      <SettingsShell />
    </RequireAuth>
  )
}