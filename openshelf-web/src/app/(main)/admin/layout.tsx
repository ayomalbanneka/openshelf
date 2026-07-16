import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminClientLayout } from '@/components/admin/AdminClientLayout';

// Strip /api suffix so we can build the full URL cleanly
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(
  /\/api\/?$/,
  ''
);

async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    if (!accessToken) return null;

    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Cookie: `access_token=${accessToken}` },
      cache: 'no-store', // never cache auth checks
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.user ?? null;
  } catch {
    return null;
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  // Not logged in — send to admin login
  if (!user) {
    redirect('/admin/login');
  }

  // Logged in as a regular user — send home, not to admin login
  if (!['ADMIN', 'MODERATOR'].includes(user.role)) {
    redirect('/');
  }

  // Valid staff — render the full admin chrome
  return <AdminClientLayout>{children}</AdminClientLayout>;
}
