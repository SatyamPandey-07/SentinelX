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
  Crown,
  Users,
  UserCheck,
  UserX,
} from 'lucide-react';
import {
  getSession,
  clearSession,
  AuthSession,
  formatDisplayName,
  isSuperAdmin,
  getRBACUserDirectory,
  updateDelegatedUserRole,
  UserRole,
} from '@/lib/auth';
import { listIncidents } from '@/lib/api';

export default function ProfilePage() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [incidentCount, setIncidentCount] = useState(0);
  const [userDirectory, setUserDirectory] = useState<
    Array<{
      userId: string;
      username: string;
      email: string;
      name: string;
      role: UserRole;
      isSuperAdmin: boolean;
    }>
  >([]);
  const [delegationSuccess, setDelegationSuccess] = useState<string | null>(null);

  useEffect(() => {
    const cur = getSession();
    setSession(cur);
    if (cur) {
      listIncidents({ size: 100 })
        .then((page) => {
          const myCount = page.content.filter((i) => i.reporter_id === cur.user_id).length;
          setIncidentCount(myCount);
        })
        .catch(() => setIncidentCount(0));

      if (isSuperAdmin(cur.email, cur.username) || cur.role === 'ROLE_ADMIN') {
        setUserDirectory(getRBACUserDirectory());
      }
    }
  }, []);

  const isAdmin =
    session?.role === 'ROLE_ADMIN' ||
    isSuperAdmin(session?.email, session?.username);
  const displayName = formatDisplayName(session);

  const handleLogout = () => {
    clearSession();
    router.push('/login?mode=signup');
  };

  const handleRoleChange = (emailOrUsername: string, newRole: UserRole) => {
    try {
      updateDelegatedUserRole(emailOrUsername, newRole);
      setUserDirectory(getRBACUserDirectory());
      setDelegationSuccess(`Updated clearance for ${emailOrUsername} to ${newRole}`);
      setTimeout(() => setDelegationSuccess(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 font-sans">
      {/* Profile Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950 border border-white/[0.08] backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
      >
        <div className="flex items-center gap-5">
          <div
            className={`w-20 h-20 rounded-2xl border-2 flex items-center justify-center shadow-lg ${
              isAdmin
                ? 'bg-red-500/15 border-red-500/40 text-red-400 shadow-red-500/20'
                : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400 shadow-cyan-500/20'
            }`}
          >
            {isAdmin ? <Crown className="w-10 h-10" /> : <User className="w-10 h-10" />}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-black font-mono tracking-wide text-white">{displayName}</h1>
              <span
                className={`px-3 py-0.5 rounded-full font-mono text-[10px] font-bold border flex items-center gap-1.5 ${
                  isAdmin
                    ? 'bg-red-500/15 text-red-400 border-red-500/40 shadow-sm shadow-red-500/20'
                    : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-red-400 animate-pulse' : 'bg-cyan-400'}`} />
                {isAdmin ? `SUPER ADMIN (${displayName.split(' ')[0].toUpperCase()})` : 'CAMPUS USER (ROLE_USER)'}
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400">
              CALLSIGN: <strong className="text-slate-200">@{session?.username || 'member'}</strong> •{' '}
              <span className="text-slate-400">{session?.email || 'not signed in'}</span>
            </p>
            <p className="text-[11px] font-mono text-slate-500">
              Clearance Level:{' '}
              {isAdmin
                ? 'Level 4 Tactical Command & Incident Authority (Single Super Admin)'
                : 'Level 1 Campus Community Safety Reporter (Endless User Account)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={isAdmin ? '/dashboard' : '/user'}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all ${
              isAdmin
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/25'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/25'
            }`}
          >
            {isAdmin ? (
              <>
                <ShieldAlert className="w-4 h-4" />
                <span>COMMAND CENTER</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>USER EMERGENCY PORTAL</span>
              </>
            )}
          </Link>

          <button
            onClick={handleLogout}
            id="btn-profile-logout"
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-red-950/40 border border-slate-700 hover:border-red-500/40 text-slate-300 hover:text-red-400 text-xs font-mono font-bold flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>SIGN OUT</span>
          </button>
        </div>
      </motion.div>

      {/* Super Admin RBAC User Management Panel (Visible to Afifa) */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-slate-900/70 border border-red-500/25 backdrop-blur-md space-y-4 shadow-xl shadow-red-950/20"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2 text-white font-mono font-bold text-sm">
              <Users className="w-5 h-5 text-red-400" />
              <span>RBAC DIRECTORY &amp; CLEARANCE GOVERNANCE (ADMIN AFIFA DECIDES)</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Endless Users Managed: <strong className="text-white">{userDirectory.length}</strong>
            </span>
          </div>

          <p className="text-xs font-mono text-slate-300 leading-relaxed">
            As Super Admin, only <strong>Afifa</strong> holds root authority over campus access. Regular users register freely
            with <code>ROLE_USER</code>, and you decide who is delegated dispatcher or staff privileges.
          </p>

          {delegationSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{delegationSuccess}</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                  <th className="py-2.5 px-3">Identity / Name</th>
                  <th className="py-2.5 px-3">Email Address</th>
                  <th className="py-2.5 px-3">Clearance Role</th>
                  <th className="py-2.5 px-3">Authority Type</th>
                  <th className="py-2.5 px-3 text-right">Afifa Delegation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {userDirectory.map((u) => (
                  <tr key={u.userId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-200">{u.name}</div>
                      <div className="text-[10px] text-slate-500">@{u.username}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{u.email}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          u.isSuperAdmin
                            ? 'bg-red-500/20 text-red-300 border-red-500/40'
                            : u.role === 'ROLE_ADMIN'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                        }`}
                      >
                        {u.isSuperAdmin ? 'SUPER ADMIN' : u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {u.isSuperAdmin ? (
                        <span className="text-red-400 font-bold flex items-center gap-1">
                          <Crown className="w-3 h-3" /> Sole Super Admin
                        </span>
                      ) : (
                        'Campus Community'
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {u.isSuperAdmin ? (
                        <span className="text-[10px] text-slate-500 italic">Root Authority</span>
                      ) : (
                        <div className="inline-flex items-center gap-1.5">
                          {u.role === 'ROLE_USER' ? (
                            <button
                              type="button"
                              onClick={() => handleRoleChange(u.username, 'ROLE_ADMIN')}
                              className="px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-300 hover:bg-amber-900/60 text-[10px] font-bold transition-all"
                            >
                              Grant Dispatcher
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRoleChange(u.username, 'ROLE_USER')}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 text-[10px] font-bold transition-all"
                            >
                              Reset to User
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

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
                <span className="text-[10px] text-slate-500 uppercase block mb-1">NAME</span>
                <span className="text-slate-200 font-bold">{displayName}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block mb-1">CALLSIGN / USERNAME</span>
                <span className="text-slate-200 font-bold">@{session?.username || '—'}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block mb-1">EMAIL ADDRESS</span>
                <span className="text-slate-200 font-bold">
                  {session?.email || `${session?.username || 'user'}@campus.edu`}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block mb-1">ASSIGNED RBAC CLEARANCE</span>
                <span className={`font-bold ${isAdmin ? 'text-red-400' : 'text-cyan-400'}`}>
                  {isAdmin ? 'SUPER ADMIN (ROLE_ADMIN)' : 'CAMPUS USER (ROLE_USER)'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/70 text-[11px] font-mono text-slate-400 space-y-1">
              <div className="text-slate-300 font-bold">SESSION AUTH STATUS:</div>
              <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                AUTHENTICATED &amp; SYNCED WITH INCIDENT BACKBONE
              </div>
            </div>
          </div>

          {/* Role Governance & Security Policy Card */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/[0.08] backdrop-blur-md space-y-4">
            <h2 className="text-sm font-bold font-mono text-white tracking-wide border-b border-white/[0.08] pb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>ROLE-BASED ACCESS CONTROL (RBAC) POLICY</span>
            </h2>

            <p className="text-xs font-mono text-slate-400 leading-relaxed">
              Campus security policy enforces that regular users cannot self-escalate to admin clearance.
              Only <strong>Super Admin Afifa</strong> (<code>afifasyed06@gmail.com</code>) holds root command authority to triage
              emergencies and manage permissions.
            </p>

            {!isAdmin ? (
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/login?mode=signin&role=admin"
                  className="px-4 py-2.5 rounded-xl bg-red-600/90 hover:bg-red-500 text-white text-xs font-mono font-bold tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-600/25 transition-all"
                >
                  <Crown className="w-4 h-4" />
                  <span>SIGN IN AS SUPER ADMIN AFIFA</span>
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
                  <span>LAUNCH TACTICAL COMMAND</span>
                </Link>
                <Link
                  href="/user"
                  className="px-4 py-2.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold flex items-center justify-center transition-all"
                >
                  VIEW USER EMERGENCY PORTAL
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Activity Telemetry Summary */}
        <div className="md:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/[0.08] backdrop-blur-md space-y-4">
            <h2 className="text-sm font-bold font-mono text-white tracking-wide border-b border-white/[0.08] pb-3 flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>INCIDENT TELEMETRY</span>
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
                  <div className="text-slate-400 text-[10px] font-mono uppercase">EMERGENCY SOS BEACON</div>
                  <div className="text-sm font-bold font-mono text-emerald-400">READY &amp; ACTIVE</div>
                </div>
                <Shield className="w-7 h-7 text-emerald-400/60" />
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="text-slate-400 text-[10px] font-mono uppercase">DISPATCH BACKBONE</div>
                  <div className="text-sm font-bold font-mono text-cyan-400">KRaft QUORUM (ONLINE)</div>
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
