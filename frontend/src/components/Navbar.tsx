'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Radio, Activity, Bell, User, Clock, Search } from 'lucide-react';

export function Navbar() {
  const [time, setTime] = useState<string>('');
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toTimeString().split(' ')[0] + ' UTC');
    };
    update();
    const interval = setInterval(update, 1000);

    try {
      const raw = localStorage.getItem('sentinelx_user');
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // corrupt/absent session data -- fall back to the placeholder below
    }

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-white/[0.08] bg-[#080A0F]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
      {/* Brand & Operational Readiness */}
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center group-hover:border-cyan-400 transition-colors">
            <Shield className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-widest text-white font-mono uppercase">VIGIL</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ACTIVE DISPATCH
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">Distributed Emergency Operations</p>
          </div>
        </Link>
      </div>

      {/* Center Tactical Status Banner */}
      <div className="hidden md:flex items-center gap-4 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-300 bg-black/40 px-3 py-1.5 rounded-lg border border-white/[0.06]">
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>KAFKA BACKBONE: <strong className="text-emerald-400">ONLINE</strong></span>
        </div>
        <div className="flex items-center gap-2 text-slate-300 bg-black/40 px-3 py-1.5 rounded-lg border border-white/[0.06]">
          <Activity className="w-3.5 h-3.5 text-amber-400" />
          <span>SLA ENGINE: <strong className="text-cyan-400">98.7%</strong></span>
        </div>
      </div>

      {/* Clock & Profile */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-white/[0.08]">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{time || '00:00:00 UTC'}</span>
        </div>

        <button className="relative p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 transition-colors border border-white/[0.08]">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
        </button>

        <div className="flex items-center gap-2.5 pl-2 border-l border-white/[0.08]">
          <div className="w-8 h-8 rounded-full bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-slate-200 font-mono">{user?.username ?? 'Ops Commander'}</div>
            <div className="text-[10px] text-slate-400 font-mono">{user?.role ?? 'ROLE_SUPERVISOR'}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
