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

    const current = getSession();
    if (!current) {
      router.replace('/login?mode=signup');
      return;
    }

    setSession(current);
    setValidated(true);
  }, [enabled, router]);

  return {
    isReady: !enabled || validated,
    session,
    isAdmin: session?.role === 'ROLE_ADMIN',
  };
}
