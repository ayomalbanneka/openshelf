'use client'
import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { RequireAdmin } from '@/components/auth/RequireAdmin'
import { http } from '@/lib/api'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [pendingCount, setPendingCount] = useState(0)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    http.get('/admin/pending?limit=1')
      .then((r) => setPendingCount(r.data.meta.total))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('adminTheme')
    if (saved === 'dark' || saved === 'light') {
      setTheme(saved)
    }
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('adminTheme', next)
  }

  return (
    <RequireAdmin>
      <div
        className={`admin-theme flex min-h-screen${theme === 'dark' ? ' admin-dark' : ''}`}
        style={{
          background: 'radial-gradient(1200px 600px at 12% -10%, rgba(14,165,233,0.16), transparent 60%), radial-gradient(900px 500px at 100% 0%, rgba(245,158,11,0.12), transparent 55%), var(--admin-bg)',
        }}
      >
        {/* Fixed sidebar */}
        <div className="hidden lg:block w-56 shrink-0 sticky top-0 h-screen">
          <AdminSidebar pendingCount={pendingCount} />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 p-6">
          <div className="flex items-center justify-end mb-4">
            <button
              onClick={toggleTheme}
              className="text-xs px-3 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2"
              style={{ backgroundColor: 'var(--admin-soft)', color: 'var(--admin-text)', border: '1px solid var(--admin-border)' }}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4" />
                  Light mode
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4" />
                  Dark mode
                </>
              )}
            </button>
          </div>
          {children}
        </div>
      </div>
    </RequireAdmin>
  )
}