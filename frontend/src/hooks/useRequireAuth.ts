'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, AuthSession } from '@/lib/auth';

export function useRequireAuth(enabled: boolean) {
  const router = useRouter();
  // `validated` tracks whether the CURRENT enabled=true streak has actually
  // checked the session yet -- it must reset to false whenever a route
  // becomes protected, not just default to "ready" (see below).
  const [validated, setValidated] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    if (!enabled) {
      // On an unprotected page (e.g. /login), auth-checking doesn't apply,
      // but leaving `validated` at whatever it last was would carry a
      // stale "checked and it was fine" flag into the very next render of
      // a protected page, before this effect has re-run for that route --
      // AppShell would then briefly compute isAdmin from the OLD session
      // (or null) and flash its "access denied" gate even for a valid
      // admin login. Resetting to false here means a fresh protected page
      // always starts unvalidated until its own check actually completes.
      setValidated(false);
      return;
    }

    // 1. If session is already available in localStorage, validate immediately
    const existing = getSession();
    if (existing) {
      setSession(existing);
      setValidated(true);
      return;
    }

    // 2. If no session yet, wait for OAuth/Clerk session hydration before bouncing
    let resolved = false;

    const handleAuthChange = () => {
      const cur = getSession();
      if (cur) {
        resolved = true;
        setSession(cur);
        setValidated(true);
      }
    };

    window.addEventListener('sentinelx_auth_change', handleAuthChange);

    // Failsafe timer: give OAuth / Clerk provider 1200ms to hydrate session
    const timer = setTimeout(() => {
      if (!resolved) {
        const finalCheck = getSession();
        if (finalCheck) {
          setSession(finalCheck);
          setValidated(true);
        } else {
          const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
          const redirectParam = currentPath && currentPath !== '/' && !currentPath.startsWith('/login')
            ? `&redirect=${encodeURIComponent(currentPath)}`
            : '';
          router.replace(`/login?mode=signin${redirectParam}`);
        }
      }
    }, 1200);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('sentinelx_auth_change', handleAuthChange);
    };
  }, [enabled, router]);

  return {
    isReady: !enabled || validated,
    session,
    isAdmin: session?.role === 'ROLE_ADMIN',
  };
}
