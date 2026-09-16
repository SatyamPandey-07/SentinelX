'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticateWithRedirectCallback, useUser } from '@clerk/nextjs';
import { persistSession, AuthSession } from '@/lib/auth';

export default function SSOCallbackPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded) return;
    if (user) {
      const pendingRole = (localStorage.getItem('sentinelx_pending_role') as any) || 'ROLE_USER';
      const session: AuthSession = {
        access_token: `clerk-token-${user.id}`,
        refresh_token: `clerk-refresh-${user.id}`,
        username:
          user.username ||
          user.firstName?.toLowerCase() ||
          user.primaryEmailAddress?.emailAddress.split('@')[0] ||
          'clerk_user',
        role: pendingRole,
        user_id: user.id,
        first_name: user.firstName || 'Campus',
        last_name: user.lastName || 'User',
        email: user.primaryEmailAddress?.emailAddress,
      };
      persistSession(session);
      router.replace(pendingRole === 'ROLE_ADMIN' ? '/dashboard' : '/user');
    }
  }, [user, isLoaded, router]);

  return (
    <div className="min-h-screen bg-[#060911] flex flex-col items-center justify-center text-xs font-mono text-cyan-400 space-y-3">
      <AuthenticateWithRedirectCallback />
      <p>AUTHENTICATING VIA CLERK OAUTH...</p>
    </div>
  );
}
