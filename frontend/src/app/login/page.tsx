'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Lock, User, Key, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@12345');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate login & set demo token
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('sentinelx_token', 'demo_jwt_token');
        localStorage.setItem('sentinelx_user', username);
      }
      router.push('/dashboard');
    }, 400);
  };

  return (
    <div className="min-h-screen -m-6 flex items-center justify-center bg-[#090d16] p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]"></div>
      <div className="absolute w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none -top-20 -left-20"></div>
      <div className="absolute w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -bottom-20 -right-20"></div>

      <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 relative z-10 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 text-emergency-critical mb-2">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold font-mono tracking-wider text-slate-100">
            SENTINEL<span className="text-emergency-critical">X</span>
          </h1>
          <p className="text-xs font-mono text-slate-400">
            SECURE INCIDENT RESPONSE &amp; COMMAND LOGIN
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-mono mb-1.5">USERNAME / CALLSIGN</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-surface-elevated border border-border text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-mono mb-1.5">AUTHENTICATION KEY</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-surface-elevated border border-border text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono font-semibold tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20"
          >
            <span>{loading ? 'AUTHENTICATING...' : 'ENTER DISPATCH CONSOLE'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Credentials Helper */}
        <div className="p-3.5 rounded-lg bg-surface-elevated border border-border/70 text-[11px] font-mono space-y-1 text-slate-400">
          <div className="text-slate-300 font-semibold">PRE-SEEDED DEMO CREDENTIALS:</div>
          <div>Admin: <span className="text-hud-cyan">admin</span> / <span className="text-slate-300">Admin@12345</span></div>
          <div>Role: <span className="text-emerald-400">ROLE_ADMIN (Full RBAC Access)</span></div>
        </div>
      </div>
    </div>
  );
}
