'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticateWithRedirectCallback, useUser } from '@clerk/nextjs';
import { persistSession, AuthSession, isSuperAdmin } from '@/lib/auth';
import { useClerkConfigured } from '@/components/ClerkProviderWrapper';

// This page only ever runs mid-OAuth-redirect with real query params from
// Clerk -- it must never be statically prerendered.
export const dynamic = 'force-dynamic';

export default function SSOCallbackPage() {
  const configured = useClerkConfigured();

  if (!configured) {
    return (
      <div className="min-h-screen bg-[#060911] flex flex-col items-center justify-center text-xs font-mono text-red-400 space-y-3">
        <p>OAUTH IS NOT CONFIGURED ON THIS DEPLOYMENT.</p>
      </div>
    );
  }

  return <SSOCallbackInner />;
}

function SSOCallbackInner() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const pendingRole = typeof window !== 'undefined' ? localStorage.getItem('sentinelx_pending_role') : null;

    if (isLoaded && user) {
      const email = user.primaryEmailAddress?.emailAddress?.toLowerCase() || '';
      const usernameCandidate = user.username || '';
      const isSuper = isSuperAdmin(email, usernameCandidate);

      const assignedRole = (isSuper || pendingRole === 'ROLE_ADMIN') ? 'ROLE_ADMIN' : 'ROLE_USER';
      const cleanUsername = isSuper ? 'Afifa' : (user.username || user.firstName || email.split('@')[0] || 'campus_user');
      const firstName = isSuper ? 'Afifa' : (user.firstName || 'Campus');
      const lastName = isSuper ? 'Syed' : (user.lastName || 'Member');

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
      router.replace(assignedRole === 'ROLE_ADMIN' ? '/dashboard' : '/user');
      return;
    }

    if (timedOut) {
      const target = pendingRole === 'ROLE_ADMIN' ? '/dashboard' : '/user';
      router.replace(target);
    }
  }, [user, isLoaded, timedOut, router]);

  const pendingRole = typeof window !== 'undefined' ? localStorage.getItem('sentinelx_pending_role') : null;
  const targetRedirect = pendingRole === 'ROLE_ADMIN' ? '/dashboard' : '/user';

  return (
    <div className="min-h-screen bg-[#060911] flex flex-col items-center justify-center text-xs font-mono text-cyan-400 space-y-3">
      <AuthenticateWithRedirectCallback
        signInForceRedirectUrl={targetRedirect}
        signUpForceRedirectUrl={targetRedirect}
        signInFallbackRedirectUrl={targetRedirect}
        signUpFallbackRedirectUrl={targetRedirect}
        continueSignUpUrl="/sso-callback"
      />
      <p>AUTHENTICATING VIA CLERK OAUTH...</p>
    </div>
  );
}
