'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { SmoothScrollProvider } from '@/components/SmoothScrollProvider';
import { PageTransition } from '@/components/PageTransition';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';
  const isAuthPage = pathname === '/login';
  // Hooks must run unconditionally -- the guard itself no-ops (and never
  // redirects) for the landing/login routes via the isProtected flag below.
  const isProtected = !isLandingPage && !isAuthPage;
  const authReady = useRequireAuth(isProtected);

  if (isLandingPage) {
    return (
      <SmoothScrollProvider>
        <div className="w-full min-h-screen bg-[#060911] text-slate-100 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-300">
          {children}
        </div>
      </SmoothScrollProvider>
    );
  }

  // The login screen is the one place a visitor is, by definition, not
  // authenticated yet -- it must never render inside the operator shell
  // (Sidebar/Navbar previously showed a fake "logged in as Ops Commander"
  // identity and live system chrome behind an unauthenticated screen).
  if (isAuthPage) {
    return (
      <div className="w-full min-h-screen bg-[#060911] text-slate-100 selection:bg-cyan-500/20 selection:text-cyan-300">
        {children}
      </div>
    );
  }

  return (
    <div className="bg-background text-slate-100 min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-4rem)] relative">
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 left-64 top-16 -z-10 opacity-[0.4]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 15% 0%, rgba(56,189,248,0.06) 0%, transparent 45%), radial-gradient(circle at 85% 100%, rgba(239,68,68,0.05) 0%, transparent 45%)',
            }}
          />
          <PageTransition pathname={pathname}>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
