'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/admin',          label: 'Overview',    icon: '📊' },
  { href: '/admin/pending',  label: 'Pending',     icon: '⏳' },
  { href: '/admin/users',    label: 'Users',       icon: '👥' },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1">
      <p
        className="text-xs font-semibold uppercase tracking-wider px-3 mb-2"
        style={{ color: 'hsl(var(--muted-foreground))' }}
      >
        Admin
      </p>
      {LINKS.map(({ href, label, icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              active
                ? 'bg-blue-50 text-blue-700'
                : 'hover:bg-gray-100'
            )}
            style={!active ? { color: 'hsl(var(--foreground))' } : undefined}
          >
            <span style={{ fontSize: 16 }}>{icon}</span>
            {label}
          </Link>
        )
      })}
    </nav>
  )
}