'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { SmoothScrollProvider } from '@/components/SmoothScrollProvider';
import { PageTransition } from '@/components/PageTransition';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { ShieldAlert, ArrowRight, Lock } from 'lucide-react';
import { switchRole } from '@/lib/auth';

const ADMIN_ONLY_ROUTES = ['/dashboard', '/incidents', '/responders', '/sla', '/analytics', '/intelligence', '/system-health', '/audit', '/settings'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLandingPage = pathname === '/';
  // /sso-callback runs mid-OAuth-flow before a session exists yet -- it
  // must stay public, or useRequireAuth bounces the user to /login before
  // the callback ever gets to call persistSession() and break Clerk login.
  const isAuthPage = pathname === '/login' || pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up') || pathname === '/sso-callback';
  const isProtected = !isLandingPage && !isAuthPage;

  const { isReady, isAdmin } = useRequireAuth(isProtected);

  if (isLandingPage) {
    return (
      <SmoothScrollProvider>
        <div className="w-full min-h-screen bg-[#060911] text-slate-100 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-300">
          {children}
        </div>
      </SmoothScrollProvider>
    );
  }

  if (isAuthPage) {
    return (
      <div className="w-full min-h-screen bg-[#060911] text-slate-100 selection:bg-cyan-500/20 selection:text-cyan-300">
        {children}
      </div>
    );
  }

  if (!isReady) {
    return <div className="bg-background min-h-screen" />;
  }

  const isRestrictedForUser = !isAdmin && ADMIN_ONLY_ROUTES.some((r) => pathname.startsWith(r));

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

          {isRestrictedForUser ? (
            <div className="max-w-2xl mx-auto my-12 p-8 rounded-2xl bg-slate-900/80 border border-red-500/30 backdrop-blur-xl text-center space-y-4 shadow-2xl">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold font-mono text-white">
                ADMINISTRATIVE DISPATCH CLEARANCE REQUIRED
              </h2>
              <p className="text-xs font-mono text-slate-400 leading-relaxed max-w-md mx-auto">
                You are currently signed in as a <strong className="text-cyan-400">Campus Reporter (USER MODE)</strong>. Access to this command console ({pathname}) requires authenticating with an <strong className="text-red-400">Administrator account</strong>.
              </p>
              <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => router.push('/login?mode=signin&role=admin')}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold tracking-wider flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>SIGN IN WITH ADMIN ACCOUNT</span>
                </button>
                <button
                  onClick={() => router.push('/user')}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold transition-all"
                >
                  RETURN TO USER PORTAL
                </button>
              </div>
            </div>
          ) : (
            <PageTransition pathname={pathname}>{children}</PageTransition>
          )}
        </main>
      </div>
    </div>
  );
}
