'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { BookOpen } from 'lucide-react'

const NAV_LINKS = [
  { href: '/browse', label: 'Browse' },
  { href: '/clubs',  label: 'Clubs' },
]

export function Navbar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header
      className="sticky top-0 z-40 w-full backdrop-blur-sm"
      style={{
        borderBottom: '1px solid hsl(var(--border))',
        backgroundColor: 'hsl(var(--background) / 0.8)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <a
              href="#top"
              className="flex items-center gap-2.5 group"
            >
              <div className="relative">
                <div className="w-9 h-9 bg-linear-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">
                Open<span className="text-blue-600">Shelf</span>
              </span>
            </a>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                pathname.startsWith(href)
                  ? 'bg-blue-50 text-blue-600'
                  : 'hover:bg-gray-100'
              )}
              style={
                !pathname.startsWith(href)
                  ? { color: 'hsl(var(--muted-foreground))' }
                  : undefined
              }
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
              >
                <span
                  className="h-7 w-7 rounded-full flex items-center justify-center font-semibold text-xs text-white"
                  style={{ backgroundColor: '#2563eb' }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="hidden sm:block">
                  {user.name.split(' ')[0]}
                </span>
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 top-full mt-1 w-48 rounded-xl py-1 z-50"
                  style={{
                    border: '1px solid hsl(var(--border))',
                    backgroundColor: 'hsl(var(--background))',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  }}
                >
                  <Link
                    href={`/users/${user.id}`}
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                    style={{ color: 'hsl(var(--foreground))' }}
                  >
                    My profile
                  </Link>
                  <Link
                    href="/lists"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                    style={{ color: 'hsl(var(--foreground))' }}
                  >
                    My lists
                  </Link>
                  {(user.role === 'ADMIN' || user.role === 'MODERATOR') && (
                    <Link
                      href="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                      style={{ color: 'hsl(var(--foreground))' }}
                    >
                      Admin
                    </Link>
                  )}
                  <hr style={{ borderColor: 'hsl(var(--border))' }} className="my-1" />
                  <button
                    onClick={() => { logout(); setMenuOpen(false) }}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3 py-1.5 text-sm font-medium transition-colors"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Join free
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  )
}