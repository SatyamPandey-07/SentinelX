'use client';

import React from 'react';
import { BarChart3, TrendingUp, Clock, CheckCircle2, Flame, ShieldAlert, Cpu, Activity, Zap, Database } from 'lucide-react';

export default function AnalyticsPage() {
  const categoryBreakdown = [
    { label: 'FIRE & EXPLOSION', count: 18, pct: '28%', width: '28%' },
    { label: 'MEDICAL EMERGENCY', count: 24, pct: '38%', width: '38%' },
    { label: 'HAZMAT & CHEMICAL', count: 6, pct: '10%', width: '10%' },
    { label: 'SECURITY THREAT', count: 10, pct: '16%', width: '16%' },
    { label: 'INFRASTRUCTURE', count: 5, pct: '8%', width: '8%' },
  ];

  const severityBreakdown = [
    { label: 'CRITICAL', count: 8, color: 'bg-red-500', text: 'text-red-400', pct: '12%' },
    { label: 'HIGH', count: 19, color: 'bg-amber-500', text: 'text-amber-400', pct: '30%' },
    { label: 'MEDIUM', count: 22, color: 'bg-cyan-500', text: 'text-cyan-400', pct: '35%' },
    { label: 'LOW', count: 14, color: 'bg-emerald-500', text: 'text-emerald-400', pct: '23%' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5 font-mono uppercase">
            <span>OPERATIONAL ANALYTICS &amp; METRICS</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-mono border border-slate-700">
              EVENT-SOURCED
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            NON-BLOCKING REDIS AGGREGATIONS // P95 TAIL LATENCY // EVENT-DRIVEN CQRS
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
          <Cpu className="w-3.5 h-3.5" />
          <span>REDIS CACHE ACTIVE (TTL: 60s)</span>
        </div>
      </div>

      {/* ========================================================
          BENTO KPI ROW
          ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Bento 1: SLA Compliance */}
        <div className="bento-card bento-card-success flex flex-col justify-between">
          <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">SLA Compliance Rate</span>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400 font-mono">98.4%</span>
            <span className="text-xs text-emerald-400/80 font-mono">TARGET &gt; 95%</span>
          </div>
          <p className="text-[11px] font-mono text-slate-400 pt-2 border-t border-emerald-950/60">
            1 breach out of 63 tracked dispatches
          </p>
        </div>

        {/* Bento 2: P95 Latency */}
        <div className="bento-card bento-card-info flex flex-col justify-between">
          <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">P95 Response Latency</span>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-cyan-400 font-mono">1.8m</span>
            <span className="text-xs text-slate-400 font-mono">P50: 42s</span>
          </div>
          <p className="text-[11px] font-mono text-slate-400 pt-2 border-t border-cyan-950/60">
            Event publish to responder ack
          </p>
        </div>

        {/* Bento 3: MTTR */}
        <div className="bento-card flex flex-col justify-between">
          <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">Mean Time to Resolve</span>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-purple-400 font-mono">14.2m</span>
            <span className="text-xs text-emerald-400 font-mono">-2.4m vs baseline</span>
          </div>
          <p className="text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
            Dispatch to final scene closure
          </p>
        </div>

        {/* Bento 4: Deduplications */}
        <div className="bento-card flex flex-col justify-between">
          <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">Duplicate Interceptions</span>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-400 font-mono">12</span>
            <span className="text-xs text-amber-300/80 font-mono">DEDUPED</span>
          </div>
          <p className="text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
            Prevented within 150m radius
          </p>
        </div>
      </div>

      {/* ========================================================
          BENTO CHARTS GRID
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Bento 5: Category Volume Distribution (Col Span 7) */}
        <div className="lg:col-span-7 bento-card space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-[11px] font-mono tracking-widest text-slate-300 uppercase font-bold flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              INCIDENT VOLUME BY CATEGORY
            </span>
            <span className="text-[10px] font-mono text-slate-400">PAST 30 DAYS</span>
          </div>

          <div className="space-y-3.5 pt-1">
            {categoryBreakdown.map((cat) => (
              <div key={cat.label} className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold">{cat.label}</span>
                  <span className="text-cyan-400">{cat.count} incidents ({cat.pct})</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: cat.width }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bento 6: Severity Matrix (Col Span 5) */}
        <div className="lg:col-span-5 bento-card space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-[11px] font-mono tracking-widest text-slate-300 uppercase font-bold flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-red-400" />
              SEVERITY DISTRIBUTION MATRIX
            </span>
            <span className="text-[10px] font-mono text-slate-400">TOTAL: 63</span>
          </div>

          <div className="space-y-3 pt-1">
            {severityBreakdown.map((sev) => (
              <div key={sev.label} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${sev.color}`}></span>
                  <span className="text-slate-200 font-bold">{sev.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">{sev.pct}</span>
                  <span className={`font-black ${sev.text}`}>{sev.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bento 7: Architecture Note (Col Span 12) */}
        <div className="lg:col-span-12 bento-card flex items-center justify-between gap-4 bg-slate-950/60 border border-slate-800 text-xs font-mono flex-wrap">
          <div className="flex items-center gap-2 text-slate-300">
            <Database className="w-4 h-4 text-cyan-400" />
            <span>CQRS Read Aggregations: Metrics streamed via Kafka to `AnalyticsService` without querying `Incident` tables.</span>
          </div>
          <span className="text-emerald-400">Zero Table Locking</span>
        </div>
      </div>
    </div>
  );
}
