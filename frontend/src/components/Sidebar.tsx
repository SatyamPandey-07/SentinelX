'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Users, 
  MapPin, 
  BarChart3, 
  ScrollText, 
  Cpu, 
  Settings, 
  LogOut 
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Operations Center', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Incident Roster', href: '/incidents', icon: AlertTriangle, badge: '4' },
  { label: 'Responder Fleet', href: '/responders', icon: Users, badge: '4/4' },
  { label: 'Campus Map', href: '/map', icon: MapPin },
  { label: 'SLA & Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Audit Trail', href: '/audit', icon: ScrollText },
  { label: 'System Topology', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-border bg-surface flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16">
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-[10px] font-mono tracking-wider text-slate-500 uppercase">
          Command Modules
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-surface-elevated'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  isActive
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'bg-surface-elevated text-slate-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Cluster Health Summary */}
      <div className="p-4 border-t border-border bg-background/40">
        <div className="p-3 rounded-lg bg-surface-elevated border border-border text-[11px] font-mono space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">SERVICES:</span>
            <span className="text-emerald-400 font-semibold">12/12 HEALTHY</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">OUTBOX LAG:</span>
            <span className="text-slate-200">0 ms (SYNCHRONIZED)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">ACTIVE TRACES:</span>
            <span className="text-hud-cyan">OTEL ACTIVE</span>
          </div>
        </div>

        <Link
          href="/login"
          className="mt-3 flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Tactical Session</span>
        </Link>
      </div>
    </aside>
  );
}
