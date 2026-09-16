'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Radio,
  Clock,
  User,
  LogOut,
  ShieldAlert,
  ChevronRight,
  Crown,
} from 'lucide-react';
import { getSession, clearSession, AuthSession, formatDisplayName, isSuperAdmin } from '@/lib/auth';
import { SafeSignedIn as SignedIn, SafeUserButton as UserButton } from '@/components/ClerkGate';

export function Navbar() {
  const router = useRouter();
  const [time, setTime] = useState<string>('');
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toTimeString().split(' ')[0] + ' UTC');
    };
    update();
    const interval = setInterval(update, 1000);

    const syncSession = () => setSession(getSession());
    syncSession();
    window.addEventListener('sentinelx_auth_change', syncSession);

    return () => {
      clearInterval(interval);
      window.removeEventListener('sentinelx_auth_change', syncSession);
    };
  }, []);

  const isAdmin = session?.role === 'ROLE_ADMIN' || session?.role === 'ROLE_SUPERVISOR' || isSuperAdmin(session?.email, session?.username);
  const displayName = formatDisplayName(session);

  const handleLogout = () => {
    clearSession();
    router.push('/login?mode=signup');
  };

  return (
    <header className="h-16 border-b border-white/[0.08] bg-[#080A0F]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-50">
      {/* Brand & Mode Display */}
      <div className="flex items-center gap-4">
        <Link href={isAdmin ? '/dashboard' : '/user'} className="flex items-center gap-3 group">
          <div className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${
            isAdmin
              ? 'bg-red-500/10 border-red-500/30 group-hover:border-red-400 text-red-400'
              : 'bg-cyan-500/10 border-cyan-500/30 group-hover:border-cyan-400 text-cyan-400'
          }`}>
            {isAdmin ? <ShieldAlert className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-widest text-white font-mono uppercase">SENTINELX</span>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono border flex items-center gap-1.5 font-bold ${
                isAdmin
                  ? 'bg-red-500/15 text-red-400 border-red-500/40 shadow-sm shadow-red-500/20'
                  : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isAdmin ? 'bg-red-400' : 'bg-cyan-400'}`} />
                {isAdmin ? 'ADMIN COMMAND' : 'USER PORTAL'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              {isAdmin ? 'Emergency Operations & Tactical Dispatch' : 'Campus Community Emergency Reporting'}
            </p>
          </div>
        </Link>
      </div>

      {/* Center Tactical Status Banner (Visible on Desktop) */}
      <div className="hidden lg:flex items-center gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-300 bg-black/40 px-3 py-1.5 rounded-lg border border-white/[0.06]">
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>BACKBONE: <strong className="text-emerald-400">ONLINE</strong></span>
        </div>

        <div className="flex items-center gap-2 text-slate-300 bg-black/40 px-3 py-1.5 rounded-lg border border-white/[0.06]">
          <span>CLEARANCE: <strong className={isAdmin ? 'text-red-400' : 'text-cyan-400'}>{isAdmin ? 'SUPER ADMIN (AFIFA)' : 'CAMPUS MEMBER'}</strong></span>
        </div>
      </div>

      {/* Clock, Profile Link & Logout */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="hidden md:flex items-center gap-2 font-mono text-xs text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-white/[0.08]">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{time || '00:00:00 UTC'}</span>
        </div>

        {/* Clean Human Profile Link -> opens /profile */}
        <Link
          href="/profile"
          id="nav-profile-btn"
          title="Click to view and manage your profile"
          className="flex items-center gap-2.5 pl-2 border-l border-white/[0.08] hover:opacity-90 group transition-all"
        >
          <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
            isAdmin
              ? 'bg-red-600/20 border-red-500/40 text-red-400 group-hover:border-red-400 group-hover:bg-red-600/30 shadow-sm shadow-red-500/20'
              : 'bg-cyan-600/20 border-cyan-500/40 text-cyan-400 group-hover:border-cyan-400 group-hover:bg-cyan-600/30'
          }`}>
            {isAdmin ? <Crown className="w-4 h-4 text-red-400" /> : <User className="w-4 h-4" />}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-slate-200 font-mono group-hover:text-cyan-300 flex items-center gap-1 transition-colors">
              <span>{displayName}</span>
              <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5" />
            </div>
            <div className={`text-[10px] font-mono font-bold tracking-wider ${isAdmin ? 'text-red-400' : 'text-cyan-400'}`}>
              {isAdmin ? 'SUPER ADMIN' : 'CAMPUS USER'}
            </div>
          </div>
        </Link>

        {/* Clerk User Button */}
        <SignedIn>
          <div className="flex items-center pl-1">
            <UserButton afterSignOutUrl="/" />
          </div>
        </SignedIn>

        <button
          onClick={handleLogout}
          id="btn-navbar-logout"
          title="Sign Out"
          className="p-2 rounded-lg bg-slate-900/80 hover:bg-red-950/40 hover:text-red-400 text-slate-400 border border-white/[0.08] transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
