'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Hourglass, Users } from 'lucide-react'

const LINKS = [
  { href: '/admin',          label: 'Overview',    icon: LayoutDashboard },
  { href: '/admin/pending',  label: 'Pending',     icon: Hourglass },
  { href: '/admin/users',    label: 'Users',       icon: Users },
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
      {LINKS.map(({ href, label, icon: Icon }) => {
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
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}