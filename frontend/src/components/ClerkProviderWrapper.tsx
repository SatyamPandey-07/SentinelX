'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { ClerkProvider, useUser } from '@clerk/nextjs';
import { persistSession, getSession, isSuperAdmin, AuthSession } from '@/lib/auth';

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const CLERK_CONFIGURED = Boolean(
  PUBLISHABLE_KEY && (PUBLISHABLE_KEY.startsWith('pk_test_') || PUBLISHABLE_KEY.startsWith('pk_live_'))
);

const ClerkConfiguredContext = createContext(false);

export function useClerkConfigured() {
  return useContext(ClerkConfiguredContext);
}

// Automatically bridges Clerk OAuth login sessions into SentinelX's local AuthSession
function ClerkSessionSync() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded || !user) return;

    const email = user.primaryEmailAddress?.emailAddress?.toLowerCase() || '';
    const usernameCandidate = user.username || '';
    const isSuper = isSuperAdmin(email, usernameCandidate);

    const pendingRole = typeof window !== 'undefined' ? localStorage.getItem('sentinelx_pending_role') : null;
    const assignedRole = (isSuper || pendingRole === 'ROLE_ADMIN') ? 'ROLE_ADMIN' : 'ROLE_USER';

    const cleanUsername = isSuper ? 'Afifa' : (user.username || user.firstName || email.split('@')[0] || 'campus_user');
    const firstName = isSuper ? 'Afifa' : (user.firstName || 'Campus');
    const lastName = isSuper ? 'Syed' : (user.lastName || 'Member');

    const cur = getSession();
    if (!cur || cur.access_token.startsWith('clerk-token-')) {
      const session: AuthSession = {
        access_token: `clerk-token-${user.id}`,
        refresh_token: `clerk-refresh-${user.id}`,
        username: cleanUsername,
        role: assignedRole,
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        email: user.primaryEmailAddress?.emailAddress || (isSuper ? 'afifasyed06@gmail.com' : `${cleanUsername}@campus.edu`),
      };
      persistSession(session);
    }
  }, [user, isLoaded]);

  return null;
}

export function ClerkProviderWrapper({ children }: { children: React.ReactNode }) {
  if (CLERK_CONFIGURED) {
    return (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <ClerkConfiguredContext.Provider value={true}>
          <ClerkSessionSync />
          {children}
        </ClerkConfiguredContext.Provider>
      </ClerkProvider>
    );
  }

  // Graceful fallback when Clerk keys are not configured yet (e.g. CI
  // builds, or before a developer has set up their own Clerk project).
  return (
    <ClerkConfiguredContext.Provider value={false}>
      {children}
    </ClerkConfiguredContext.Provider>
  );
}
