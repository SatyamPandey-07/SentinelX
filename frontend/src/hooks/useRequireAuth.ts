'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, AuthSession } from '@/lib/auth';

export function useRequireAuth(enabled: boolean) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    if (!enabled) {
      setReady(true);
      return;
    }

    const current = getSession();
    if (!current) {
      router.replace('/login?mode=signup');
      return;
    }

    setSession(current);
    setReady(true);
  }, [enabled, router]);

  return {
    isReady: !enabled || ready,
    session,
    isAdmin: session?.role === 'ROLE_ADMIN' || session?.role === 'ROLE_SUPERVISOR',
  };
}
