'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticateWithRedirectCallback, useUser } from '@clerk/nextjs';
import { persistSession, AuthSession, isSuperAdmin } from '@/lib/auth';

export default function SSOCallbackPage() {
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
