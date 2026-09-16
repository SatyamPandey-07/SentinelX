'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Lock, User, Mail, ArrowRight, Loader2, TriangleAlert, UserPlus } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

type Mode = 'signin' | 'signup';

interface AuthSession {
  access_token: string;
  refresh_token: string;
  username: string;
  role: string;
  user_id: string;
}

function persistSession(data: AuthSession) {
  localStorage.setItem('sentinelx_token', data.access_token);
  localStorage.setItem('sentinelx_refresh_token', data.refresh_token);
  localStorage.setItem(
    'sentinelx_user',
    JSON.stringify({ username: data.username, role: data.role, userId: data.user_id })
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Sign in
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@12345');

  // Sign up
  const [suUsername, setSuUsername] = useState('');
  const [suEmail, setSuEmail] = useState('');
  const [suFirstName, setSuFirstName] = useState('');
  const [suLastName, setSuLastName] = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [suConfirm, setSuConfirm] = useState('');

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setFieldErrors({});
  };

  const handleSignIn = async (e: React.FormEvent) => {
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

      persistSession(data);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach the authentication service');
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (suPassword !== suConfirm) {
      setFieldErrors({ confirm: 'Passwords do not match' });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: suUsername,
          email: suEmail,
          password: suPassword,
          first_name: suFirstName,
          last_name: suLastName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          setFieldErrors(data.details);
          throw new Error('Please fix the highlighted fields');
        }
        throw new Error(data.message || 'Registration failed');
      }

      // register returns tokens directly -- new account is signed in immediately
      persistSession(data);
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

        {/* Mode tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-slate-950/80 border border-slate-800 font-mono text-xs">
          <button
            type="button"
            onClick={() => switchMode('signin')}
            className={`py-2 rounded-md tracking-wider transition-colors ${
              mode === 'signin' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            SIGN IN
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className={`py-2 rounded-md tracking-wider transition-colors ${
              mode === 'signup' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            SIGN UP
          </button>
        </div>

        <AnimatePresence mode="wait">
          {mode === 'signin' ? (
            <motion.form
              key="signin"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSignIn}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-mono mb-1.5">USERNAME / CALLSIGN</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="signin-username"
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
                    id="signin-password"
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

              {/* Demo Credentials Helper */}
              <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/70 text-[11px] font-mono space-y-1 text-slate-400">
                <div className="text-slate-300 font-semibold">PRE-SEEDED DEMO CREDENTIALS:</div>
                <div>Admin: <span className="text-cyan-400">admin</span> / <span className="text-slate-300">Admin@12345</span></div>
                <div>Role: <span className="text-emerald-400">ROLE_ADMIN (Full RBAC Access)</span></div>
              </div>
            </motion.form>
          ) : (
            <motion.form
              key="signup"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSignUp}
              className="space-y-3.5 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-mono mb-1.5">FIRST NAME</label>
                  <input
                    id="signup-first-name"
                    type="text"
                    required
                    autoComplete="given-name"
                    value={suFirstName}
                    onChange={(e) => setSuFirstName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 font-mono transition-colors"
                  />
                  {fieldErrors.first_name && (
                    <p className="mt-1 text-[10px] text-red-400 font-mono">{fieldErrors.first_name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-slate-300 font-mono mb-1.5">LAST NAME</label>
                  <input
                    id="signup-last-name"
                    type="text"
                    required
                    autoComplete="family-name"
                    value={suLastName}
                    onChange={(e) => setSuLastName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 font-mono transition-colors"
                  />
                  {fieldErrors.last_name && (
                    <p className="mt-1 text-[10px] text-red-400 font-mono">{fieldErrors.last_name}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-mono mb-1.5">USERNAME / CALLSIGN</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="signup-username"
                    type="text"
                    required
                    minLength={3}
                    maxLength={32}
                    autoComplete="username"
                    value={suUsername}
                    onChange={(e) => setSuUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 font-mono transition-colors"
                  />
                </div>
                {fieldErrors.username && (
                  <p className="mt-1 text-[10px] text-red-400 font-mono">{fieldErrors.username}</p>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-mono mb-1.5">EMAIL</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="signup-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={suEmail}
                    onChange={(e) => setSuEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 font-mono transition-colors"
                  />
                </div>
                {fieldErrors.email && (
                  <p className="mt-1 text-[10px] text-red-400 font-mono">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-mono mb-1.5">PASSWORD (MIN 8 CHARS)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="signup-password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={suPassword}
                    onChange={(e) => setSuPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 font-mono transition-colors"
                  />
                </div>
                {fieldErrors.password && (
                  <p className="mt-1 text-[10px] text-red-400 font-mono">{fieldErrors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-mono mb-1.5">CONFIRM PASSWORD</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="signup-confirm-password"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={suConfirm}
                    onChange={(e) => setSuConfirm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 font-mono transition-colors"
                  />
                </div>
                {fieldErrors.confirm && (
                  <p className="mt-1 text-[10px] text-red-400 font-mono">{fieldErrors.confirm}</p>
                )}
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
                    <span>PROVISIONING ACCOUNT...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>CREATE ACCOUNT &amp; ENTER</span>
                  </>
                )}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
