'use client'
import { useEffect, useState, useRef } from 'react'
import { http } from '@/lib/api'
import Link from 'next/link'

interface AdminUser {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'MODERATOR' | 'USER'
  isActive: boolean
  createdAt: string
  _count: { uploads: number }
}

const ROLE_COLOURS: Record<string, { bg: string; text: string }> = {
  ADMIN:     { bg: '#fee2e2', text: '#991b1b' },
  MODERATOR: { bg: '#fef3c7', text: '#92400e' },
  USER:      { bg: '#f0fdf4', text: '#166534' },
}

export default function UsersPage() {
  const [users, setUsers]       = useState<AdminUser[]>([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [acting, setActing]     = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const fetchUsers = (q = '') => {
    setLoading(true)
    http.get(`/admin/users${q ? `?search=${encodeURIComponent(q)}` : ''}`)
      .then((r) => {
        setUsers(r.data.data)
        setTotal(r.data.meta.total)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setSearch(q)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => fetchUsers(q), 400)
  }

  const handleRoleChange = async (id: string, role: string) => {
    setActing(id)
    try {
      const { data } = await http.patch(`/admin/users/${id}/role`, { role })
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role: data.role } : u))
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update role')
    } finally {
      setActing(null)
    }
  }

  const handleToggleActive = async (id: string) => {
    setActing(id)
    try {
      const { data } = await http.patch(`/admin/users/${id}/toggle`)
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, isActive: data.isActive } : u))
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update status')
    } finally {
      setActing(null)
    }
  }

  const inputStyle = {
    border: '1px solid hsl(var(--border))',
    backgroundColor: 'hsl(var(--background))',
    color: 'hsl(var(--foreground))',
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Users</h1>
          <p style={{ color: 'hsl(var(--muted-foreground))' }}>
            {total} registered user{total !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={handleSearch}
          placeholder="Search by name or email…"
          className="h-9 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 w-64"
          style={inputStyle}
        />
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid hsl(var(--border))' }}
      >
        {/* Table header */}
        <div
          className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-semibold uppercase tracking-wider"
          style={{
            backgroundColor: 'hsl(var(--muted))',
            color: 'hsl(var(--muted-foreground))',
          }}
        >
          <div className="col-span-4">User</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-2 text-center">Uploads</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-2 text-center">Actions</div>
        </div>

        {/* Rows */}
        {loading ? (
          <div className="flex flex-col gap-0">
            {[1,2,3,4,5].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse mx-4 my-2 rounded-lg"
                style={{ backgroundColor: 'hsl(var(--muted))' }}
              />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div
            className="py-12 text-center text-sm"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            No users found.
          </div>
        ) : (
          users.map((user, i) => (
            <div
              key={user.id}
              className="grid grid-cols-12 gap-4 px-4 py-3 items-center text-sm"
              style={{
                borderTop: i === 0 ? 'none' : '1px solid hsl(var(--border))',
                backgroundColor: user.isActive ? undefined : 'hsl(var(--muted) / 0.4)',
              }}
            >
              {/* User info */}
              <div className="col-span-4 min-w-0">
                <Link
                  href={`/users/${user.id}`}
                  className="font-medium hover:text-blue-600 transition-colors truncate block"
                >
                  {user.name}
                </Link>
                <p
                  className="text-xs truncate"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                  {user.email}
                </p>
              </div>

              {/* Role selector */}
              <div className="col-span-2">
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  disabled={acting === user.id}
                  className="text-xs px-2 py-1 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  style={{
                    ...inputStyle,
                    backgroundColor: ROLE_COLOURS[user.role].bg,
                    color: ROLE_COLOURS[user.role].text,
                    fontWeight: 500,
                  }}
                >
                  <option value="USER">User</option>
                  <option value="MODERATOR">Moderator</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              {/* Upload count */}
              <div
                className="col-span-2 text-center text-xs"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              >
                {user._count.uploads}
              </div>

              {/* Status badge */}
              <div className="col-span-2 flex justify-center">
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={
                    user.isActive
                      ? { backgroundColor: '#dcfce7', color: '#166534' }
                      : { backgroundColor: '#fee2e2', color: '#991b1b' }
                  }
                >
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Toggle button */}
              <div className="col-span-2 flex justify-center">
                <button
                  onClick={() => handleToggleActive(user.id)}
                  disabled={acting === user.id}
                  className="text-xs px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
                  style={{
                    border: '1px solid hsl(var(--border))',
                    color: 'hsl(var(--muted-foreground))',
                  }}
                >
                  {acting === user.id
                    ? '…'
                    : user.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  )
}