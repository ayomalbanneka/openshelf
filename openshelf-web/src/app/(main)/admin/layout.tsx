import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { RequireAdmin } from '@/components/auth/RequireAdmin'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RequireAdmin>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-52 shrink-0">
            <AdminSidebar />
          </aside>
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </RequireAdmin>
  )
}