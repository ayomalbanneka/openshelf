'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth.store';

export function AuthBootstrap() {
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const ran = useRef(false);

  useEffect(() => {
    if (!hasHydrated || ran.current) return;
    ran.current = true;

    // Only bother re-validating against the server if we think someone's
    // logged in — an anonymous visitor doesn't need a wasted /auth/me call.
    if (user) {
      fetchMe();
    }
  }, [hasHydrated, user, fetchMe]);

  return null;
}
