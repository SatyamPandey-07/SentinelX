'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticateWithRedirectCallback, useUser } from '@clerk/nextjs';
import { persistSession, AuthSession, isSuperAdmin } from '@/lib/auth';
import { useClerkConfigured } from '@/components/ClerkProviderWrapper';

// This page only ever runs mid-OAuth-redirect with real query params from
// Clerk -- it must never be statically prerendered.
export const dynamic = 'force-dynamic';

// `force-dynamic` alone isn't enough: Next.js still performs a build-time
// SSR pass of 'use client' pages to produce their initial HTML shell, and
// in CI (no NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY set) ClerkProviderWrapper
// correctly skips mounting <ClerkProvider> -- so useUser(), called
// directly in this component, threw "can only be used within a
// <ClerkProvider>" during that pass and failed the build (reproduced
// live in CI; a local build with a real key set never hits this path,
// which is why an earlier fix here looked correct but wasn't). The actual
// fix: isolate the Clerk-dependent hook in a child component that only
// ever mounts once useClerkConfigured() confirms a real <ClerkProvider>
// exists, so useUser() is never called without one -- same pattern as
// ClerkGate.tsx's SafeSignedIn/SafeSignedOut/SafeUserButton.
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

  useEffect(() => {
    if (!isLoaded) return;
    if (user) {
      const email = user.primaryEmailAddress?.emailAddress?.toLowerCase() || '';
      const usernameCandidate = user.username || '';
      const isAfifa = isSuperAdmin(email, usernameCandidate);

      // Strict RBAC: Only Super Admin Afifa gets ROLE_ADMIN. All other endless users get ROLE_USER.
      const assignedRole = isAfifa ? 'ROLE_ADMIN' : 'ROLE_USER';
      const cleanUsername = isAfifa ? 'Afifa' : (user.username || user.firstName || email.split('@')[0] || 'campus_user');
      const firstName = isAfifa ? 'Afifa' : (user.firstName || 'Campus');
      const lastName = isAfifa ? 'Syed' : (user.lastName || 'Member');

      const session: AuthSession = {
        access_token: `clerk-token-${user.id}`,
        refresh_token: `clerk-refresh-${user.id}`,
        username: cleanUsername,
        role: assignedRole,
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        email: user.primaryEmailAddress?.emailAddress || (isAfifa ? 'afifasyed06@gmail.com' : `${cleanUsername}@campus.edu`),
      };

      persistSession(session);
      router.replace(assignedRole === 'ROLE_ADMIN' ? '/dashboard' : '/user');
    }
  }, [user, isLoaded, router]);

  return (
    <div className="min-h-screen bg-[#060911] flex flex-col items-center justify-center text-xs font-mono text-cyan-400 space-y-3">
      <AuthenticateWithRedirectCallback />
      <p>AUTHENTICATING VIA CLERK OAUTH...</p>
    </div>
  );
}
