'use client';

import React from 'react';
import { BarChart3, TrendingUp, Clock, CheckCircle2, Flame, ShieldAlert, Cpu } from 'lucide-react';

export default function AnalyticsPage() {
  const categoryBreakdown = [
    { label: 'FIRE & EXPLOSION', count: 18, pct: '28%' },
    { label: 'MEDICAL EMERGENCY', count: 24, pct: '38%' },
    { label: 'HAZMAT & CHEMICAL', count: 6, pct: '10%' },
    { label: 'SECURITY THREAT', count: 10, pct: '16%' },
    { label: 'INFRASTRUCTURE', count: 5, pct: '8%' },
  ];

  const severityBreakdown = [
    { label: 'CRITICAL', count: 8, color: 'bg-red-500' },
    { label: 'HIGH', count: 19, color: 'bg-amber-500' },
    { label: 'MEDIUM', count: 22, color: 'bg-blue-500' },
    { label: 'LOW', count: 14, color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <span>OPERATIONAL ANALYTICS &amp; SLA ENGINE</span>
            <span className="text-xs px-2 py-0.5 rounded bg-surface-elevated text-slate-400 font-mono">
              EVENT-SOURCED METRICS
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            NON-BLOCKING REDIS AGGREGATIONS // P95 TAIL LATENCY DISTRIBUTIONS
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
          <Cpu className="w-3.5 h-3.5" />
          <span>REDIS CACHE ACTIVE (TTL: 60s)</span>
        </div>
      </div>

      {/* Latency & SLA Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface border border-border">
          <span className="text-xs font-mono text-slate-400 uppercase">SLA Compliance Rate</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-400 font-mono">98.4%</span>
            <span className="text-xs text-emerald-400/80 font-mono">TARGET &gt; 95%</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">1 breach out of 63 tracked incident dispatches</p>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border">
          <span className="text-xs font-mono text-slate-400 uppercase">P95 Response Latency</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-400 font-mono">1.8 min</span>
            <span className="text-xs text-slate-400 font-mono">P50: 42 sec</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Measured from event publish to responder acknowledgement</p>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border">
          <span className="text-xs font-mono text-slate-400 uppercase">Mean Time to Resolve (MTTR)</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-hud-cyan font-mono">14.2 min</span>
            <span className="text-xs text-emerald-400 font-mono">-2.4m</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Average duration from dispatch to scene closure</p>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border">
          <span className="text-xs font-mono text-slate-400 uppercase">Duplicate Interceptions</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-purple-400 font-mono">12</span>
            <span className="text-xs text-slate-400 font-mono">DEDUPED</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Prevented duplicate dispatches within 100m windows</p>
        </div>
      </div>

      {/* Breakdown Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Category Distribution */}
        <div className="p-5 rounded-xl bg-surface border border-border space-y-4">
          <h2 className="text-xs font-mono font-semibold uppercase text-slate-200 tracking-wider">
            INCIDENT VOLUME BY CATEGORY
          </h2>

          <div className="space-y-3">
            {categoryBreakdown.map((cat) => (
              <div key={cat.label} className="space-y-1 text-xs">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-slate-300">{cat.label}</span>
                  <span className="text-slate-400">{cat.count} ({cat.pct})</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-elevated overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: cat.pct }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Severity Distribution */}
        <div className="p-5 rounded-xl bg-surface border border-border space-y-4">
          <h2 className="text-xs font-mono font-semibold uppercase text-slate-200 tracking-wider">
            SEVERITY TRIAGE DISTRIBUTION
          </h2>

          <div className="space-y-4">
            {severityBreakdown.map((sev) => (
              <div key={sev.label} className="flex items-center justify-between p-3 rounded-lg bg-surface-elevated border border-border text-xs font-mono">
                <div className="flex items-center gap-2.5">
                  <span className={`w-3 h-3 rounded-full ${sev.color}`}></span>
                  <span className="text-slate-200 font-bold">{sev.label}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-400">{sev.count} INCIDENTS</span>
                  <span className="text-slate-200 font-semibold">{Math.round((sev.count / 63) * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
