'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Flame, 
  HeartPulse, 
  ShieldAlert, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  UserCheck, 
  Radio, 
  TrendingUp, 
  ChevronRight,
  Plus
} from 'lucide-react';
import { MOCK_INCIDENTS, MOCK_RESPONDERS } from '@/lib/mock-data';

export default function DashboardPage() {
  const [incidents, setIncidents] = useState(MOCK_INCIDENTS);
  const [responders, setResponders] = useState(MOCK_RESPONDERS);

  const criticalCount = incidents.filter(i => i.severity === 'CRITICAL' && i.status !== 'RESOLVED').length;
  const availableResponders = responders.filter(r => r.status === 'AVAILABLE').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <span>TACTICAL OPERATIONS CENTER</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            CENTRAL CAMPUS DISPATCH // KAFKA EVENT STREAM ACTIVE // REDIS DISTRIBUTED LOCKS ENGAGED
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/incidents"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold tracking-wide transition-all shadow-lg shadow-red-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>REPORT INCIDENT</span>
          </Link>
        </div>
      </div>

      {/* KPI HUD Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Critical Active */}
        <div className="p-4 rounded-xl bg-surface border border-red-500/30 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-red-500/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Critical Triage</span>
            <span className="p-1.5 rounded-md bg-red-500/20 text-red-400">
              <Flame className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-red-400 font-mono">{criticalCount}</span>
            <span className="text-xs text-red-300/80 font-mono">PRIORITY 1</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            <span>Chemical spill requires Hazmat containment</span>
          </div>
        </div>

        {/* Card 2: Responder Availability */}
        <div className="p-4 rounded-xl bg-surface border border-emerald-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Responders Ready</span>
            <span className="p-1.5 rounded-md bg-emerald-500/20 text-emerald-400">
              <UserCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-400 font-mono">{availableResponders}/{responders.length}</span>
            <span className="text-xs text-emerald-400/80 font-mono">AVAILABLE</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            <span>3 units currently deployed on active scenes</span>
          </div>
        </div>

        {/* Card 3: SLA Performance */}
        <div className="p-4 rounded-xl bg-surface border border-blue-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">SLA Compliance</span>
            <span className="p-1.5 rounded-md bg-blue-500/20 text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-400 font-mono">98.4%</span>
            <span className="text-xs text-emerald-400 font-mono">+1.2%</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            <span>Zero breaches in the last 24 operational hours</span>
          </div>
        </div>

        {/* Card 4: P95 MTTA */}
        <div className="p-4 rounded-xl bg-surface border border-border relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">P95 Response (MTTA)</span>
            <span className="p-1.5 rounded-md bg-hud-cyan/20 text-hud-cyan">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-100 font-mono">1.8m</span>
            <span className="text-xs text-slate-400 font-mono">TARGET &lt; 2.0m</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            <span>Fastest assignment: 14s via Location gRPC</span>
          </div>
        </div>
      </div>

      {/* Main Tactical Feed & Responder Fleet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Incident Command Stream */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h2 className="text-sm font-semibold tracking-wider text-slate-200 uppercase font-mono flex items-center gap-2">
              <Radio className="w-4 h-4 text-hud-cyan animate-pulse" />
              <span>ACTIVE INCIDENTS (PRIORITY QUEUE)</span>
            </h2>
            <Link href="/incidents" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono">
              <span>VIEW FULL ROSTER</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {incidents.map((incident) => {
              const isCritical = incident.severity === 'CRITICAL';
              const isResolved = incident.status === 'RESOLVED';

              return (
                <div
                  key={incident.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isCritical
                      ? 'bg-red-950/20 border-red-500/40 shadow-sm'
                      : isResolved
                      ? 'bg-surface/50 border-border opacity-70'
                      : 'bg-surface border-border hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-slate-400">{incident.id}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                          incident.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                          incident.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                          incident.severity === 'MEDIUM' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' :
                          'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        }`}>
                          {incident.severity}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-surface-elevated text-slate-300 font-mono">
                          {incident.category}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                          incident.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400' :
                          incident.status === 'ASSIGNED' ? 'bg-blue-500/20 text-blue-300' :
                          'bg-amber-500/20 text-amber-300'
                        }`}>
                          {incident.status}
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold text-slate-100">{incident.title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2">{incident.description}</p>
                    </div>

                    <Link
                      href={`/incidents/${incident.id}`}
                      className="px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors font-mono shrink-0"
                    >
                      TRIAGE &rarr;
                    </Link>
                  </div>

                  {/* Incident Footer metadata */}
                  <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] font-mono text-slate-400 flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <span>{incident.location.building} // {incident.location.floor}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {incident.assigned_responder_name && (
                        <span className="text-blue-400">UNIT: {incident.assigned_responder_name}</span>
                      )}
                      {!isResolved && (
                        <span className="text-amber-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>SLA DEADLINE ACTIVE</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Responder Unit Deployment */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h2 className="text-sm font-semibold tracking-wider text-slate-200 uppercase font-mono">
              RESPONDER FLEET STATUS
            </h2>
            <Link href="/responders" className="text-xs text-blue-400 hover:text-blue-300 font-mono">
              MANAGE
            </Link>
          </div>

          <div className="space-y-3">
            {responders.map((resp) => (
              <div key={resp.id} className="p-3.5 rounded-xl bg-surface border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">{resp.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                    resp.status === 'AVAILABLE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                    resp.status === 'EN_ROUTE' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' :
                    resp.status === 'ON_SCENE' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40' :
                    'bg-slate-700 text-slate-300'
                  }`}>
                    {resp.status}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {resp.skills.map((skill) => (
                    <span key={skill} className="text-[9px] px-1.5 py-0.5 rounded bg-surface-elevated text-slate-400 font-mono">
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between pt-1 border-t border-border/50">
                  <span>ACTIVE LOAD: {resp.active_incidents} INCIDENTS</span>
                  <span>TEL: {resp.phone}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Architecture live note */}
          <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 text-xs space-y-2">
            <div className="font-semibold text-blue-300 font-mono">DISTRIBUTED CONCURRENCY</div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              When simultaneous incidents occur, candidate responders are locked using Redis SETNX tokens to prevent race conditions and duplicate dispatches.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
