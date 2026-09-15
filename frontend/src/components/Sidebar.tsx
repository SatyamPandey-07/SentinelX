'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Shield
} from 'lucide-react';

const NAV_ITEMS = [
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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-white/[0.08] bg-[#080A0F] flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16">
      <div className="p-4 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-mono tracking-widest text-slate-500 uppercase">
          VIGIL MODULES
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-mono font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Cluster Health Summary */}
      <div className="p-4 border-t border-white/[0.08] bg-black/20">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] text-[11px] font-mono space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">SERVICES:</span>
            <span className="text-emerald-400 font-bold">11/11 NOMINAL</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">OUTBOX LAG:</span>
            <span className="text-slate-200">0 ms (SYNC)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">CLUSTER:</span>
            <span className="text-cyan-400">KRaft-01</span>
          </div>
        </div>

        <Link
          href="/login"
          className="mt-3 flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Tactical Session</span>
        </Link>
      </div>
    </aside>
  );
}
