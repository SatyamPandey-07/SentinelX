'use client';

import React from 'react';
import { Clock, AlertTriangle, CheckCircle2, ShieldAlert, Zap, Cpu } from 'lucide-react';
import { MOCK_INCIDENTS } from '@/lib/mock-data';

export default function SlaMonitorPage() {
  const slaTiers = [
    { tier: "CRITICAL", duration: "2 MINUTES", color: "text-red-400 border-red-500/40 bg-red-950/20", activeCount: 1, target: "< 120s" },
    { tier: "HIGH", duration: "5 MINUTES", color: "text-amber-400 border-amber-500/40 bg-amber-950/20", activeCount: 2, target: "< 300s" },
    { tier: "MEDIUM", duration: "15 MINUTES", color: "text-cyan-400 border-cyan-500/40 bg-cyan-950/20", activeCount: 3, target: "< 900s" },
    { tier: "LOW", duration: "30 MINUTES", color: "text-emerald-400 border-emerald-500/40 bg-emerald-950/20", activeCount: 1, target: "< 1800s" },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5 font-mono uppercase">
            <span>SLA ENGINE &amp; TIMER MONITOR</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono border border-cyan-500/30">
              NON-POLLING ZSET
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            REDIS SORTED SETS (`ZRANGEBYSCORE`) // 80% EARLY WARNING THRESHOLD // 100% BREACH DETECTION
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 bg-cyan-950/30 border border-cyan-500/30 px-3 py-1.5 rounded-lg">
          <Clock className="w-3.5 h-3.5" />
          <span>SLA COMPLIANCE: 98.7%</span>
        </div>
      </div>

      {/* 4 SLA Tier Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {slaTiers.map((t) => (
          <div key={t.tier} className={`p-5 rounded-xl border ${t.color} flex flex-col justify-between space-y-3`}>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold">{t.tier} SLA</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-black/40 border border-current font-bold">
                {t.activeCount} ACTIVE
              </span>
            </div>

            <div>
              <div className="text-2xl font-black font-mono text-white">{t.duration}</div>
              <span className="text-[11px] font-mono text-slate-400 mt-0.5 block">Ack Target: {t.target}</span>
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Warning Threshold: 80%</span>
              <span className="text-emerald-400">NOMINAL</span>
            </div>
          </div>
        ))}
      </div>

      {/* Active Ticking SLA Queue */}
      <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0A0D14] space-y-4">
        <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-white/[0.08]">
          <Clock className="w-4 h-4 text-cyan-400" />
          TRACKED INCIDENTS WITH ACTIVE COUNTDOWNS
        </span>

        <div className="space-y-3">
          {MOCK_INCIDENTS.map((inc) => (
            <div key={inc.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4 flex-wrap font-mono text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{inc.id}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                    inc.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {inc.severity}
                  </span>
                  <span className="text-slate-400">{inc.title}</span>
                </div>
                <span className="text-[11px] text-slate-500">{inc.location.building} // Reported at {inc.created_at}</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">SLA REMAINING</span>
                  <span className="text-sm font-bold text-cyan-400">01:24 remaining</span>
                </div>
                <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                  HEALTHY
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
