'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Radio, Activity, Bell, User, Clock } from 'lucide-react';

export function Navbar() {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toTimeString().split(' ')[0] + ' UTC');
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-border bg-surface/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
      {/* Brand & Operational Readiness */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-emergency-critical" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-wider text-slate-100 font-mono">SENTINEL<span className="text-emergency-critical">X</span></span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ACTIVE DISPATCH
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">Distributed Emergency &amp; Incident Operations</p>
          </div>
        </div>
      </div>

      {/* Center Tactical Status Banner */}
      <div className="hidden md:flex items-center gap-6 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-300 bg-background/60 px-3 py-1.5 rounded border border-border">
          <Radio className="w-3.5 h-3.5 text-hud-cyan animate-pulse" />
          <span>KAFKA BACKBONE: <strong className="text-emerald-400">ONLINE</strong></span>
        </div>
        <div className="flex items-center gap-2 text-slate-300 bg-background/60 px-3 py-1.5 rounded border border-border">
          <Activity className="w-3.5 h-3.5 text-hud-amber" />
          <span>SLA ENGINE: <strong className="text-emerald-400">MONITORING (ZSET)</strong></span>
        </div>
      </div>

      {/* Clock & Profile */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 font-mono text-sm text-slate-300 bg-surface-elevated px-3 py-1.5 rounded-md border border-border">
          <Clock className="w-4 h-4 text-hud-cyan" />
          <span>{time || '00:00:00 UTC'}</span>
        </div>

        <button className="relative p-2 rounded-lg bg-surface-elevated hover:bg-slate-700 text-slate-300 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emergency-critical"></span>
        </button>

        <div className="flex items-center gap-2.5 pl-2 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-medium text-slate-200">Ops Supervisor</div>
            <div className="text-[10px] text-slate-400 font-mono">ROLE_ADMIN</div>
          </div>
        </div>
      </div>
    </header>
  );
}
