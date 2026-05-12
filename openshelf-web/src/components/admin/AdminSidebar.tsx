'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import {
  LayoutDashboard, Hourglass, Users, BookOpen, Activity,
  Library, Tags, FolderOpen, Users2, LogOut, type LucideIcon,
} from 'lucide-react'

type NavItem = { href: string; label: string; icon: LucideIcon; badge?: 'pending' }
type NavSection = { section: string; items: NavItem[] }

const ADMIN_LINKS: NavSection[] = [
  { section: 'Overview', items: [
    { href: '/admin',            label: 'Dashboard',  icon: LayoutDashboard },
  ]},
  { section: 'Content', items: [
    { href: '/admin/pending',    label: 'Pending',    icon: Hourglass, badge: 'pending' },
    { href: '/admin/monitoring', label: 'Monitoring',  icon: Activity },
    { href: '/admin/resources',  label: 'Resources',  icon: Library },
    { href: '/admin/categories', label: 'Categories', icon: FolderOpen },
    { href: '/admin/tags',       label: 'Tags',       icon: Tags },
  ]},
  { section: 'Community', items: [
    { href: '/admin/clubs',      label: 'Clubs',      icon: Users2 },
  ]},
  { section: 'Access', items: [
    { href: '/admin/users',      label: 'Users',      icon: Users },
  ]},
]

const MOD_LINKS: NavSection[] = [
  { section: 'Overview', items: [
    { href: '/admin',            label: 'Dashboard',  icon: LayoutDashboard },
  ]},
  { section: 'Content', items: [
    { href: '/admin/pending',    label: 'Pending',    icon: Hourglass, badge: 'pending' },
  ]},
]

export function AdminSidebar({ pendingCount = 0 }: { pendingCount?: number }) {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN'
  const links = isAdmin ? ADMIN_LINKS : MOD_LINKS

  return (
    <aside
      className="flex flex-col h-full rounded-2xl overflow-hidden"
      style={{
        background: 'var(--admin-sidebar-bg)',
        minHeight: '100vh',
        color: 'var(--admin-sidebar-text)',
        boxShadow: 'var(--admin-shadow)',
      }}
    >
      {/* Logo */}
      <div className="px-5 py-6" style={{ borderBottom: '1px solid var(--admin-sidebar-divider)' }}>
        <div className="flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--admin-sidebar-accent)' }}
          >
            <BookOpen className="w-4 h-4" style={{ color: 'white' }} />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight" style={{ color: 'var(--admin-sidebar-text)' }}>OpenShelf</p>
            <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--admin-sidebar-muted)' }}>
              {isAdmin ? 'Admin Panel' : 'Moderator Panel'}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto flex flex-col gap-5">
        {links.map(({ section, items }) => (
          <div key={section}>
            <p className="text-[10px] font-bold uppercase tracking-widest px-2 mb-1.5" style={{ color: 'var(--admin-sidebar-muted)' }}>
              {section}
            </p>
            <div className="flex flex-col gap-0.5">
              {items.map(({ href, label, icon: Icon, badge }) => {
                const active = pathname === href || (href !== '/admin' && pathname.startsWith(href))
                const showBadge = badge === 'pending' && pendingCount > 0
                return (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all"
                    style={
                      active
                          ? { background: 'var(--admin-sidebar-active)', color: 'var(--admin-sidebar-text)', borderLeft: '3px solid var(--admin-sidebar-active-border)' }
                          : { color: 'var(--admin-sidebar-muted)', paddingLeft: active ? undefined : '15px' }
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1">{label}</span>
                    {showBadge && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: 'var(--admin-badge-bg)', color: 'var(--admin-badge-text)' }}
                      >
                        {pendingCount}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid var(--admin-sidebar-divider)' }}>
        <div className="flex items-center gap-3 px-2 mb-3">
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: 'var(--admin-sidebar-accent)' }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--admin-sidebar-text)' }}>{user?.name}</p>
            <p className="text-[10px]" style={{ color: 'var(--admin-sidebar-muted)' }}>{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm transition-all"
          style={{ color: 'var(--admin-sidebar-muted)' }}
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}