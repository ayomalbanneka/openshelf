'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useHydrated } from '@/hooks/useHydrated';

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const storeHydrated = useAuthStore((s) => s.hasHydrated);
  const router = useRouter();
  const reactHydrated = useHydrated();

  const ready = reactHydrated && storeHydrated;

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace('/admin/login');
    } else if (user.role !== 'ADMIN' && user.role !== 'MODERATOR') {
      router.replace('/');
    }
  }, [ready, user, router]);

  if (!ready) return null;
  if (!user) return null;
  if (user.role !== 'ADMIN' && user.role !== 'MODERATOR') return null;

  return <>{children}</>;
}
