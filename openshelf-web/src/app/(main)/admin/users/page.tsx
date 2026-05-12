'use client'
import { useEffect, useState, useRef } from 'react'
import { http } from '@/lib/api'
import Link from 'next/link'
import { getErrorMessage } from '@/lib/errors'
import { toast } from '@/lib/toast'

interface AdminUser {
  id: string; name: string; email: string
  role: 'ADMIN' | 'MODERATOR' | 'USER'
  isActive: boolean; isEmailVerified: boolean; createdAt: string; country?: string
  _count: { uploads: number; reviews: number; followers: number }
}

const ROLE_STYLE: Record<string, { backgroundColor: string; color: string }> = {
  ADMIN:     { backgroundColor: '#fee2e2', color: '#991b1b' },
  MODERATOR: { backgroundColor: '#fef3c7', color: '#92400e' },
  USER:      { backgroundColor: '#eff6ff', color: '#1d4ed8' },
}

export default function UsersPage() {
  const [users, setUsers]   = useState<AdminUser[]>([])
  const [total, setTotal]   = useState(0)
  const [page, setPage]     = useState(1)
  const [pages, setPages]   = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [role, setRole]     = useState('')
  const [acting, setActing] = useState<string | null>(null)
  const [error, setError]   = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const limit = 20

  const fetch_ = (q = search, r = role, p = page) => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams()
    if (q) params.set('search', q)
    if (r) params.set('role', r)
    params.set('page', String(p))
    params.set('limit', String(limit))
    http.get(`/admin/users?${params}`)
      .then((res) => {
        setUsers(res.data.data)
        setTotal(res.data.meta.total)
        setPages(res.data.meta.pages)
        setPage(res.data.meta.page)
      })
      .catch((err) => setError(getErrorMessage(err, 'Failed to load users')))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetch_(search, role, page) }, [page])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    const shouldFetchNow = page === 1
    setSearch(q)
    setPage(1)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      if (shouldFetchNow) fetch_(q, role, 1)
    }, 350)
  }

  const handleRoleChange = async (id: string, newRole: string) => {
    setActing(id)
    try {
      const { data } = await http.patch(`/admin/users/${id}/role`, { role: newRole })
      setUsers((p) => p.map((u) => u.id === id ? { ...u, role: data.role } : u))
      toast.success('Role updated')
    } catch (err: unknown) { toast.error(getErrorMessage(err, 'Failed to update role')) }
    finally { setActing(null) }
  }

  const handleToggle = async (id: string, active: boolean) => {
    let reason = ''
    if (active) {
      reason = prompt('Reason for blocking (will be emailed):') ?? ''
      if (reason === null) return
    }
    setActing(id)
    try {
      const { data } = await http.patch(`/admin/users/${id}/toggle`, { reason })
      setUsers((p) => p.map((u) => u.id === id ? { ...u, isActive: data.isActive } : u))
      toast.success(data.isActive ? 'User activated' : 'User deactivated')
    } catch (err: unknown) { toast.error(getErrorMessage(err, 'Failed to update status')) }
    finally { setActing(null) }
  }

  const inputStyle = { border: '1px solid var(--admin-border)', backgroundColor: 'var(--admin-surface)', color: 'var(--admin-text)' }
  const row = 'grid grid-cols-12 gap-3 px-4 py-3 items-center text-sm'

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--admin-text)' }}>Users</h1>
          <p className="text-sm" style={{ color: 'var(--admin-muted)' }}>{total} registered users</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={role} onChange={(e) => {
            const next = e.target.value
            const shouldFetchNow = page === 1
            setRole(next)
            setPage(1)
            if (shouldFetchNow) fetch_(search, next, 1)
          }}
            className="h-9 rounded-xl px-3 text-sm outline-none" style={inputStyle}>
            <option value="">All roles</option>
            <option value="USER">Users</option>
            <option value="MODERATOR">Moderators</option>
            <option value="ADMIN">Admins</option>
          </select>
          <input value={search} onChange={handleSearch} placeholder="Search by name or email…"
            className="h-9 rounded-xl px-3 text-sm outline-none w-60" style={inputStyle} />
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 text-sm rounded-xl px-4 py-3"
          style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
          <span>{error}</span>
          <button
            onClick={() => fetch_(search, role, page)}
            className="text-xs px-3 py-1.5 rounded-xl font-semibold"
            style={{ backgroundColor: '#fecaca', color: '#7f1d1d' }}
          >
            Retry
          </button>
        </div>
      )}

      <div className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', boxShadow: 'var(--admin-card-shadow)' }}>
        <div className={`${row} text-xs font-bold uppercase tracking-wider`}
          style={{ backgroundColor: 'var(--admin-soft)', color: 'var(--admin-muted)', borderBottom: '1px solid var(--admin-border)' }}>
          <div className="col-span-3">User</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-1 text-center">Uploads</div>
          <div className="col-span-1 text-center">Reviews</div>
          <div className="col-span-1 text-center">Followers</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-2 text-center">Actions</div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-0">
            {[1,2,3,4,5].map((i) => <div key={i} className="h-16 mx-4 my-2 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--admin-soft)' }} />)}
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: 'var(--admin-muted)' }}>No users found.</div>
        ) : (
          users.map((user, i) => (
            <div key={user.id} className={row}
              style={{ borderTop: i === 0 ? 'none' : '1px solid var(--admin-border)', opacity: user.isActive ? 1 : 0.6 }}>
              <div className="col-span-3 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: 'linear-gradient(135deg, #0ea5e9, #22c55e)' }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <Link href={`/user/${user.id}`} target="_blank"
                      className="text-sm font-medium truncate block hover:text-blue-600 transition-colors"
                      style={{ color: 'var(--admin-text)' }}>
                      {user.name}
                    </Link>
                    <p className="text-xs truncate" style={{ color: 'var(--admin-muted)' }}>{user.email}</p>
                  </div>
                </div>
              </div>

              <div className="col-span-2">
                <select value={user.role} disabled={acting === user.id}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  className="text-xs px-2 py-1 rounded-lg outline-none disabled:opacity-50 font-semibold"
                  style={{ ...ROLE_STYLE[user.role], border: 'none' }}>
                  <option value="USER">User</option>
                  <option value="MODERATOR">Moderator</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="col-span-1 text-center text-xs" style={{ color: 'var(--admin-muted)' }}>{user._count.uploads}</div>
              <div className="col-span-1 text-center text-xs" style={{ color: 'var(--admin-muted)' }}>{user._count.reviews}</div>
              <div className="col-span-1 text-center text-xs" style={{ color: 'var(--admin-muted)' }}>{user._count.followers}</div>

              <div className="col-span-2 flex justify-center">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={user.isActive
                    ? { backgroundColor: '#dcfce7', color: '#166534' }
                    : { backgroundColor: '#fee2e2', color: '#991b1b' }}>
                  {user.isActive ? 'Active' : 'Blocked'}
                </span>
              </div>

              <div className="col-span-2 flex justify-center">
                <button onClick={() => handleToggle(user.id, user.isActive)} disabled={acting === user.id}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                  style={user.isActive
                    ? { backgroundColor: '#fee2e2', color: '#b91c1c' }
                    : { backgroundColor: '#dcfce7', color: '#166534' }}>
                  {acting === user.id ? '...' : user.isActive ? 'Block' : 'Unblock'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="text-xs px-3 py-1.5 rounded-xl font-semibold disabled:opacity-50"
            style={{ backgroundColor: 'var(--admin-soft)', color: 'var(--admin-text)' }}
          >
            Prev
          </button>
          <span className="text-xs" style={{ color: 'var(--admin-muted)' }}>Page {page} of {pages}</span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages || loading}
            className="text-xs px-3 py-1.5 rounded-xl font-semibold disabled:opacity-50"
            style={{ backgroundColor: 'var(--admin-soft)', color: 'var(--admin-text)' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}