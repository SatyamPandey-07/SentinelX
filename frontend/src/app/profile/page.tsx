'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  User,
  Shield,
  ShieldAlert,
  Mail,
  KeyRound,
  Clock,
  LogOut,
  ArrowRight,
  CheckCircle2,
  Lock,
  Phone,
  Radio,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { getSession, clearSession, AuthSession } from '@/lib/auth';
import { getSharedIncidents } from '@/lib/incident-store';

export default function ProfilePage() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [incidentCount, setIncidentCount] = useState(0);

  useEffect(() => {
    const cur = getSession();
    setSession(cur);
    if (cur) {
      const incidents = getSharedIncidents();
      const myCount = incidents.filter(
        (i) => i.reporter_id === cur.user_id || i.reporter_id === cur.username || i.reporter_id.startsWith('usr-')
      ).length;
      setIncidentCount(myCount);
    }
  }, []);

  const isAdmin = session?.role === 'ROLE_ADMIN' || session?.role === 'ROLE_SUPERVISOR';

  const handleLogout = () => {
    clearSession();
    router.push('/login?mode=signup');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 font-sans">
      {/* Profile Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950 border border-white/[0.08] backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
      >
        <div className="flex items-center gap-5">
          <div className={`w-20 h-20 rounded-2xl border-2 flex items-center justify-center shadow-lg ${
            isAdmin
              ? 'bg-red-500/15 border-red-500/40 text-red-400 shadow-red-500/20'
              : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400 shadow-cyan-500/20'
          }`}>
            {isAdmin ? <ShieldAlert className="w-10 h-10" /> : <User className="w-10 h-10" />}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black font-mono tracking-wide text-white">
                {session?.first_name ? `${session.first_name} ${session.last_name}` : (session?.username || 'Operator Profile')}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold border ${
                isAdmin
                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                  : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
              }`}>
                {session?.role || 'ROLE_USER'}
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400">
              CALLSIGN / ID: <strong className="text-slate-200">@{session?.username || 'unknown'}</strong>
            </p>
            <p className="text-[11px] font-mono text-slate-500">
              Clearance: {isAdmin ? 'Level 4 Tactical Command & Dispatch' : 'Level 1 Campus Community Safety Reporter'}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          id="btn-profile-logout"
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-red-950/40 border border-slate-700 hover:border-red-500/40 text-slate-300 hover:text-red-400 text-xs font-mono font-bold flex items-center gap-2 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>SIGN OUT</span>
        </button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Identity & Account Details */}
        <div className="md:col-span-7 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/[0.08] backdrop-blur-md space-y-4">
            <h2 className="text-sm font-bold font-mono text-white tracking-wide border-b border-white/[0.08] pb-3 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-cyan-400" />
              <span>SECURITY CREDENTIALS &amp; IDENTITY</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block mb-1">USERNAME / CALLSIGN</span>
                <span className="text-slate-200 font-bold">{session?.username || '—'}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block mb-1">EMAIL ADDRESS</span>
                <span className="text-slate-200 font-bold">{session?.email || `${session?.username || 'user'}@campus.edu`}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block mb-1">OPERATIONAL MODE</span>
                <span className={`font-bold ${isAdmin ? 'text-red-400' : 'text-cyan-400'}`}>
                  {isAdmin ? 'ADMIN COMMAND MODE' : 'USER SAFETY MODE'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block mb-1">SESSION STATUS</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  AUTHENTICATED
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/70 text-[11px] font-mono text-slate-400 space-y-1">
              <div className="text-slate-300 font-bold">ACTIVE SESSION TOKEN:</div>
              <div className="text-[10px] text-slate-500 break-all">
                {session?.access_token ? `${session.access_token.slice(0, 36)}...` : 'token_mock_sentinelx_active'}
              </div>
            </div>
          </div>

          {/* Role Switching & Access Policy Card */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/[0.08] backdrop-blur-md space-y-4">
            <h2 className="text-sm font-bold font-mono text-white tracking-wide border-b border-white/[0.08] pb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>ACCESS CONTROL &amp; SWITCHING POLICY</span>
            </h2>

            <p className="text-xs font-mono text-slate-400 leading-relaxed">
              In accordance with campus security protocols, administrative clearance cannot be self-escalated without authentication. To access the Admin Command Center, you must sign in with verified administrator credentials.
            </p>

            {!isAdmin ? (
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/login?mode=signin&role=admin"
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-600/25 transition-all"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>SIGN IN WITH ADMIN ACCOUNT</span>
                </Link>
                <Link
                  href="/user"
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center justify-center transition-all"
                >
                  RETURN TO USER PORTAL
                </Link>
              </div>
            ) : (
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/dashboard"
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-600/25 transition-all"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>OPEN COMMAND CENTER</span>
                </Link>
                <Link
                  href="/user"
                  className="px-4 py-2.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold flex items-center justify-center transition-all"
                >
                  VIEW USER PORTAL
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Activity Summary */}
        <div className="md:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/[0.08] backdrop-blur-md space-y-4">
            <h2 className="text-sm font-bold font-mono text-white tracking-wide border-b border-white/[0.08] pb-3 flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>ACTIVITY TELEMETRY</span>
            </h2>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="text-slate-400 text-[10px] font-mono uppercase">MY REPORTED INCIDENTS</div>
                  <div className="text-2xl font-black font-mono text-white">{incidentCount}</div>
                </div>
                <FileText className="w-7 h-7 text-cyan-400/60" />
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="text-slate-400 text-[10px] font-mono uppercase">EMERGENCY SOS READY</div>
                  <div className="text-sm font-bold font-mono text-emerald-400">ACTIVE ON BEACON</div>
                </div>
                <Shield className="w-7 h-7 text-emerald-400/60" />
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="text-slate-400 text-[10px] font-mono uppercase">RESPONSE NETWORK</div>
                  <div className="text-sm font-bold font-mono text-cyan-400">KRaft-01 QUORUM</div>
                </div>
                <Radio className="w-7 h-7 text-cyan-400/60 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
