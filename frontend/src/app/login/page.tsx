'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldAlert, Lock, User, ArrowRight, Loader2, TriangleAlert } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@12345');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Invalid username or password');
      }

      localStorage.setItem('sentinelx_token', data.access_token);
      localStorage.setItem('sentinelx_refresh_token', data.refresh_token);
      localStorage.setItem(
        'sentinelx_user',
        JSON.stringify({ username: data.username, role: data.role, userId: data.user_id })
      );
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach the authentication service');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#060911]">
      {/* Ambient field: tactical grid + drifting glow orbs, same visual language as the landing page */}
      <div className="absolute inset-0 opacity-[0.25] bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:26px_26px]" />
      <motion.div
        className="absolute w-[32rem] h-[32rem] bg-red-600/10 rounded-full blur-[110px] pointer-events-none"
        initial={{ x: -160, y: -160 }}
        animate={{ x: [-160, -100, -160], y: [-160, -100, -160] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute right-0 bottom-0 w-[32rem] h-[32rem] bg-cyan-600/10 rounded-full blur-[110px] pointer-events-none"
        initial={{ x: 120, y: 120 }}
        animate={{ x: [120, 60, 120], y: [120, 60, 120] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
        className="w-full max-w-md bg-slate-900/70 border border-slate-800 rounded-2xl p-8 relative z-10 shadow-2xl shadow-black/50 backdrop-blur-xl space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4, ease: 'backOut' }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 mb-2 shadow-[0_0_30px_-8px_rgba(239,68,68,0.6)]"
          >
            <ShieldAlert className="w-8 h-8" />
          </motion.div>
          <h1 className="text-2xl font-bold font-mono tracking-wider text-slate-100">
            SENTINEL<span className="text-red-500">X</span>
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
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 font-mono transition-colors"
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
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 font-mono transition-colors"
              />
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 font-mono"
            >
              <TriangleAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-mono font-semibold tracking-wider flex items-center justify-center gap-2 transition-colors shadow-lg shadow-cyan-600/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AUTHENTICATING...</span>
              </>
            ) : (
              <>
                <span>ENTER DISPATCH CONSOLE</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        {/* Demo Credentials Helper */}
        <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/70 text-[11px] font-mono space-y-1 text-slate-400">
          <div className="text-slate-300 font-semibold">PRE-SEEDED DEMO CREDENTIALS:</div>
          <div>Admin: <span className="text-cyan-400">admin</span> / <span className="text-slate-300">Admin@12345</span></div>
          <div>Role: <span className="text-emerald-400">ROLE_ADMIN (Full RBAC Access)</span></div>
        </div>
      </motion.div>
    </div>
  );
}
