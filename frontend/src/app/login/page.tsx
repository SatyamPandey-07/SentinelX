'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Shield,
  Lock,
  User,
  Mail,
  ArrowRight,
  Loader2,
  TriangleAlert,
  UserPlus,
  Radio,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { authenticate, registerUser, persistSession, AuthSession } from '@/lib/auth';

type ViewMode = 'signup' | 'signin';
type RoleChoice = 'USER' | 'ADMIN';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialMode = (searchParams.get('mode') as ViewMode) || 'signup';
  const initialRole = (searchParams.get('role')?.toUpperCase() as RoleChoice) || 'USER';

  const [mode, setMode] = useState<ViewMode>(initialMode);
  const [selectedRole, setSelectedRole] = useState<RoleChoice>(initialRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  // Sign In State (start empty so user is not automatically logged in as admin)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Sign Up State
  const [suFirstName, setSuFirstName] = useState('');
  const [suLastName, setSuLastName] = useState('');
  const [suUsername, setSuUsername] = useState('');
  const [suEmail, setSuEmail] = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [suConfirm, setSuConfirm] = useState('');
  const [adminAuthKey, setAdminAuthKey] = useState('');

  useEffect(() => {
    const urlMode = searchParams.get('mode') as ViewMode;
    if (urlMode === 'signin' || urlMode === 'signup') {
      setMode(urlMode);
    }
    const urlRole = searchParams.get('role')?.toUpperCase() as RoleChoice;
    if (urlRole === 'USER' || urlRole === 'ADMIN') {
      setSelectedRole(urlRole);
    }
  }, [searchParams]);

  const switchMode = (next: ViewMode) => {
    setMode(next);
    setError(null);
    setFieldErrors({});
  };

  const handleRouteAfterAuth = (session: AuthSession) => {
    if (session.role === 'ROLE_ADMIN' || session.role === 'ROLE_SUPERVISOR') {
      router.push('/dashboard');
    } else {
      router.push('/user');
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const session = await authenticate(username, password);
      handleRouteAfterAuth(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const errors: Record<string, string> = {};

    if (suPassword !== suConfirm) {
      errors.confirm = 'Passwords do not match';
    }
    if (suPassword.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }
    if (selectedRole === 'ADMIN' && adminAuthKey && adminAuthKey !== 'SENTINEL-ADMIN-2026') {
      errors.adminKey = 'Invalid Admin Passcode. Use SENTINEL-ADMIN-2026 or leave blank for demo.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const session = await registerUser({
        username: suUsername.trim(),
        email: suEmail.trim(),
        password: suPassword,
        first_name: suFirstName.trim(),
        last_name: suLastName.trim(),
        role: selectedRole,
      });

      handleRouteAfterAuth(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      setLoading(false);
    }
  };

  const fillQuickDemo = (type: 'admin' | 'user') => {
    if (type === 'admin') {
      setUsername('admin');
      setPassword('Admin@12345');
      setMode('signin');
      setError(null);
    } else {
      setUsername('campus_user');
      setPassword('User@12345');
      setMode('signin');
      setError(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#060911]">
      {/* Tactical Glow Elements */}
      <div className="absolute inset-0 opacity-[0.25] bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:26px_26px]" />
      <motion.div
        className="absolute w-[36rem] h-[36rem] bg-red-600/10 rounded-full blur-[120px] pointer-events-none"
        initial={{ x: -160, y: -160 }}
        animate={{ x: [-160, -90, -160], y: [-160, -90, -160] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute right-0 bottom-0 w-[36rem] h-[36rem] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none"
        initial={{ x: 120, y: 120 }}
        animate={{ x: [120, 50, 120], y: [120, 50, 120] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 relative z-10 shadow-2xl shadow-black/60 backdrop-blur-xl space-y-6"
      >
        {/* Header with Brand */}
        <div className="text-center space-y-1.5">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4, ease: 'backOut' }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-red-500/20 border border-cyan-500/40 text-cyan-400 mb-2 shadow-[0_0_35px_-8px_rgba(56,189,248,0.5)]"
          >
            <ShieldAlert className="w-8 h-8 text-cyan-400" />
          </motion.div>
          <h1 className="text-2xl font-black font-mono tracking-wider text-slate-100">
            SENTINEL<span className="text-red-500">X</span>
          </h1>
          <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">
            {mode === 'signup' ? 'Create Account • Choose Operational Mode' : 'Secure Command & Incident Response Login'}
          </p>
        </div>

        {/* Mode Switch Tabs (Sign Up First Flow) */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-950/90 border border-slate-800 font-mono text-xs">
          <button
            type="button"
            id="tab-signup"
            onClick={() => switchMode('signup')}
            className={`py-2.5 rounded-lg tracking-wider font-semibold flex items-center justify-center gap-2 transition-all ${
              mode === 'signup'
                ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>1. SIGN UP (NEW)</span>
          </button>
          <button
            type="button"
            id="tab-signin"
            onClick={() => switchMode('signin')}
            className={`py-2.5 rounded-lg tracking-wider font-semibold flex items-center justify-center gap-2 transition-all ${
              mode === 'signin'
                ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>2. SIGN IN</span>
          </button>
        </div>

        {/* Global Error Notice */}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono"
          >
            <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {mode === 'signup' ? (
            /* ========================================================
               SIGN UP FORM WITH ROLE / MODE SELECTION
               ======================================================== */
            <motion.form
              key="signup"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSignUp}
              className="space-y-4 text-xs font-mono"
            >
              {/* Operational Mode Selection Cards */}
              <div>
                <label className="block text-slate-300 font-bold mb-2 tracking-wider">
                  STEP 1: SELECT ACCOUNT MODE
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* USER MODE CARD */}
                  <div
                    onClick={() => setSelectedRole('USER')}
                    className={`cursor-pointer p-3.5 rounded-xl border transition-all relative ${
                      selectedRole === 'USER'
                        ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-500/15'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-cyan-400" />
                        <span className="font-bold text-slate-100 text-xs">USER MODE</span>
                      </div>
                      {selectedRole === 'USER' && (
                        <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Campus Community Member, Student &amp; Staff. Report emergencies and track real-time incident status.
                    </p>
                    <div className="mt-2 text-[10px] text-cyan-400/90 font-semibold">
                      Access: User Emergency Portal
                    </div>
                  </div>

                  {/* ADMIN MODE CARD */}
                  <div
                    onClick={() => setSelectedRole('ADMIN')}
                    className={`cursor-pointer p-3.5 rounded-xl border transition-all relative ${
                      selectedRole === 'ADMIN'
                        ? 'bg-red-950/40 border-red-500 shadow-md shadow-red-500/15'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Radio className="w-4 h-4 text-red-400" />
                        <span className="font-bold text-slate-100 text-xs">ADMIN MODE</span>
                      </div>
                      {selectedRole === 'ADMIN' && (
                        <CheckCircle2 className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Campus Security, Dispatchers &amp; Admins. Full Command Center, Responder Triage, SLA &amp; Audit.
                    </p>
                    <div className="mt-2 text-[10px] text-red-400/90 font-semibold">
                      Access: Full Dispatch Console
                    </div>
                  </div>
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">FIRST NAME</label>
                  <input
                    id="signup-first-name"
                    type="text"
                    required
                    placeholder="Jane"
                    value={suFirstName}
                    onChange={(e) => setSuFirstName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">LAST NAME</label>
                  <input
                    id="signup-last-name"
                    type="text"
                    required
                    placeholder="Doe"
                    value={suLastName}
                    onChange={(e) => setSuLastName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 transition-colors"
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-slate-300 mb-1">USERNAME / CALLSIGN</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    id="signup-username"
                    type="text"
                    required
                    minLength={3}
                    maxLength={32}
                    placeholder="callsign or campus id"
                    value={suUsername}
                    onChange={(e) => setSuUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 transition-colors"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-slate-300 mb-1">CAMPUS EMAIL</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    id="signup-email"
                    type="email"
                    required
                    placeholder="user@campus.edu"
                    value={suEmail}
                    onChange={(e) => setSuEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 transition-colors"
                  />
                </div>
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">PASSWORD (MIN 8)</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      placeholder="••••••••"
                      value={suPassword}
                      onChange={(e) => setSuPassword(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="mt-1 text-[10px] text-red-400">{fieldErrors.password}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">CONFIRM PASSWORD</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      id="signup-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={suConfirm}
                      onChange={(e) => setSuConfirm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 transition-colors"
                    />
                  </div>
                  {fieldErrors.confirm && (
                    <p className="mt-1 text-[10px] text-red-400">{fieldErrors.confirm}</p>
                  )}
                </div>
              </div>

              {/* Admin Passcode for Admin Mode */}
              {selectedRole === 'ADMIN' && (
                <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/30 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-red-400 font-bold">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>ADMIN AUTHORIZATION CODE (OPTIONAL FOR DEMO)</span>
                  </div>
                  <input
                    type="text"
                    placeholder="SENTINEL-ADMIN-2026 (Optional)"
                    value={adminAuthKey}
                    onChange={(e) => setAdminAuthKey(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-red-500/30 text-slate-100 text-xs focus:outline-none focus:border-red-400"
                  />
                  {fieldErrors.adminKey && (
                    <p className="text-[10px] text-red-400">{fieldErrors.adminKey}</p>
                  )}
                  <p className="text-[10px] text-slate-400">
                    Use code <span className="text-cyan-400">SENTINEL-ADMIN-2026</span> or leave blank to auto-verify in development mode.
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                id="btn-signup-submit"
                disabled={loading}
                className={`w-full py-3 rounded-xl font-bold tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg ${
                  selectedRole === 'ADMIN'
                    ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-red-600/25 hover:from-red-500 hover:to-red-400'
                    : 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-cyan-600/25 hover:from-cyan-500 hover:to-cyan-400'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>PROVISIONING ACCOUNT...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>REGISTER AS {selectedRole} &amp; ENTER</span>
                  </>
                )}
              </motion.button>

              <div className="text-center text-[11px] text-slate-400 pt-1">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className="text-cyan-400 hover:underline font-bold"
                >
                  Sign in here
                </button>
              </div>
            </motion.form>
          ) : (
            /* ========================================================
               SIGN IN FORM
               ======================================================== */
            <motion.form
              key="signin"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSignIn}
              className="space-y-4 text-xs font-mono"
            >
              <div>
                <label className="block text-slate-300 mb-1.5 font-bold">USERNAME OR CAMPUS EMAIL</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    id="signin-username"
                    type="text"
                    required
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1.5 font-bold">PASSWORD</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    id="signin-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                id="btn-signin-submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:opacity-60 text-white font-bold tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-600/25"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AUTHENTICATING...</span>
                  </>
                ) : (
                  <>
                    <span>AUTHENTICATE &amp; ENTER</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>

              {/* 1-Click Demo Fillers */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2 text-[11px]">
                <div className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>PRE-SEEDED DEMO ACCOUNTS (CLICK TO AUTOFILL):</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fillQuickDemo('admin')}
                    className="p-2 rounded-lg bg-red-950/30 border border-red-500/30 hover:border-red-400 text-left transition-colors group"
                  >
                    <div className="text-red-400 font-bold group-hover:text-red-300">ADMIN MODE</div>
                    <div className="text-slate-400 text-[10px]">admin / Admin@12345</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillQuickDemo('user')}
                    className="p-2 rounded-lg bg-cyan-950/30 border border-cyan-500/30 hover:border-cyan-400 text-left transition-colors group"
                  >
                    <div className="text-cyan-400 font-bold group-hover:text-cyan-300">USER MODE</div>
                    <div className="text-slate-400 text-[10px]">campus_user / User@12345</div>
                  </button>
                </div>
              </div>

              <div className="text-center text-[11px] text-slate-400 pt-1">
                Need to create an account first?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="text-cyan-400 hover:underline font-bold"
                >
                  Sign up here
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#060911]" />}>
      <LoginContent />
    </Suspense>
  );
}
