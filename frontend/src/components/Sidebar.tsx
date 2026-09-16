'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Radio,
  AlertTriangle,
  Users,
  MapPin,
  BarChart3,
  ScrollText,
  Server,
  Clock,
  Bot,
  Settings,
  LogOut,
  Shield,
  FilePlus,
  PhoneCall,
  ShieldAlert,
} from 'lucide-react';
import { getSession, clearSession, AuthSession } from '@/lib/auth';

const ADMIN_NAV_ITEMS = [
  { label: 'Command Center', href: '/dashboard', icon: Radio },
  { label: 'Incidents', href: '/incidents', icon: AlertTriangle, badge: '4' },
  { label: 'Live Map', href: '/map', icon: MapPin },
  { label: 'Responders', href: '/responders', icon: Users, badge: '4' },
  { label: 'SLA Monitor', href: '/sla', icon: Clock },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'VIGIL Intelligence', href: '/intelligence', icon: Bot },
  { label: 'System Health', href: '/system-health', icon: Server },
  { label: 'Audit Log', href: '/audit', icon: ScrollText },
  { label: 'Settings', href: '/settings', icon: Settings },
];

const USER_NAV_ITEMS = [
  { label: 'Campus Safety Home', href: '/user', icon: Shield },
  { label: 'Report Incident', href: '/user#report', icon: FilePlus },
  { label: 'My Reports', href: '/user#my-incidents', icon: Clock, badge: '2' },
  { label: 'Campus Radar Map', href: '/map', icon: MapPin },
  { label: 'Emergency Hotlines', href: '/user#contacts', icon: PhoneCall },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    const sync = () => setSession(getSession());
    sync();
    window.addEventListener('sentinelx_auth_change', sync);
    return () => window.removeEventListener('sentinelx_auth_change', sync);
  }, []);

  const isAdmin = session?.role === 'ROLE_ADMIN' || session?.role === 'ROLE_SUPERVISOR';
  const navItems = isAdmin ? ADMIN_NAV_ITEMS : USER_NAV_ITEMS;

  const handleLogout = () => {
    clearSession();
    router.push('/login?mode=signup');
  };

  return (
    <aside className="w-64 border-r border-white/[0.08] bg-[#080A0F] flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16">
      <div className="p-4 space-y-1 overflow-y-auto">
        <div className="flex items-center justify-between px-3 py-2 text-[10px] font-mono tracking-widest text-slate-500 uppercase">
          <span>{isAdmin ? 'ADMIN COMMAND MODULES' : 'USER SAFETY MODULES'}</span>
          <span className={`px-1.5 py-0.2 rounded font-bold text-[9px] ${
            isAdmin ? 'bg-red-500/20 text-red-400' : 'bg-cyan-500/20 text-cyan-300'
          }`}>
            {isAdmin ? 'ADMIN' : 'USER'}
          </span>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && item.href !== '/user' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-mono font-medium transition-colors ${
                isActive
                  ? isAdmin ? 'text-red-300' : 'text-cyan-300'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-pill"
                  className={`absolute inset-0 rounded-xl border ${
                    isAdmin ? 'bg-red-500/15 border-red-500/30' : 'bg-cyan-500/15 border-cyan-500/30'
                  }`}
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <div className="relative flex items-center gap-3">
                <Icon className={`w-4 h-4 ${
                  isActive ? (isAdmin ? 'text-red-400' : 'text-cyan-400') : 'text-slate-500'
                }`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`relative text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  isActive
                    ? isAdmin ? 'bg-red-500/20 text-red-300' : 'bg-cyan-500/20 text-cyan-300'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Cluster Health / Clearance Summary */}
      <div className="p-4 border-t border-white/[0.08] bg-black/20">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] text-[11px] font-mono space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">CLEARANCE:</span>
            <span className={`font-bold ${isAdmin ? 'text-red-400' : 'text-cyan-400'}`}>
              {isAdmin ? 'ADMIN LEVEL 4' : 'CAMPUS REPORTER'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">OPERATIONAL:</span>
            <span className="text-emerald-400 font-bold">DISPATCH READY</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">SESSION:</span>
            <span className="text-slate-200">{session?.username || 'Active'}</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          id="btn-sidebar-logout"
          className="mt-3 w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Session</span>
        </button>
      </div>
    </aside>
  );
}
