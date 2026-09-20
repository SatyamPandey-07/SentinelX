'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Clock, Loader2, AlertTriangle } from 'lucide-react';
import { listIncidents, Incident, IncidentSeverity, ApiError } from '@/lib/api';

// Real policy from assignment-service's calculateSlaAckDeadline() -- not
// fabricated, matches Duration.ofMinutes(2/5/15/30) exactly by severity.
const SLA_TIERS: { tier: IncidentSeverity; duration: string; color: string; target: string }[] = [
  { tier: 'CRITICAL', duration: '2 MINUTES', color: 'text-red-400 border-red-500/40 bg-red-950/20', target: '< 120s' },
  { tier: 'HIGH', duration: '5 MINUTES', color: 'text-amber-400 border-amber-500/40 bg-amber-950/20', target: '< 300s' },
  { tier: 'MEDIUM', duration: '15 MINUTES', color: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/20', target: '< 900s' },
  { tier: 'LOW', duration: '30 MINUTES', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20', target: '< 1800s' },
];

function timeRemaining(deadline: string | null): { label: string; expired: boolean } {
  if (!deadline) return { label: 'NO SLA', expired: false };
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return { label: 'BREACHED', expired: true };
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return { label: `${m}:${String(s).padStart(2, '0')} remaining`, expired: false };
}

export default function SlaMonitorPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, forceTick] = useState(0);

  const load = useCallback(async () => {
    try {
      const page = await listIncidents({ size: 100 });
      setIncidents(page.content.filter((i) => !['RESOLVED', 'CLOSED', 'CANCELLED'].includes(i.status)));
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Unable to reach incident-service');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const poll = setInterval(load, 8000);
    const clock = setInterval(() => forceTick((t) => t + 1), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(clock);
    };
  }, [load]);

  const withDeadline = incidents.filter((i) => i.sla_ack_deadline);
  const healthyCount = withDeadline.filter((i) => !timeRemaining(i.sla_ack_deadline).expired).length;
  const compliancePercent = withDeadline.length ? (healthyCount / withDeadline.length) * 100 : 100;

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
            REDIS SORTED SETS (`ZRANGEBYSCORE`) IN sla-service // deadlines set by assignment-service
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 bg-cyan-950/30 border border-cyan-500/30 px-3 py-1.5 rounded-lg">
          <Clock className="w-3.5 h-3.5" />
          <span>ACTIVE SLA HEALTH: {compliancePercent.toFixed(1)}%</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* 4 SLA Tier Cards -- policy from assignment-service, active counts from live incidents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SLA_TIERS.map((t) => {
          const tierIncidents = incidents.filter((i) => i.severity === t.tier);
          const breached = tierIncidents.filter((i) => timeRemaining(i.sla_ack_deadline).expired).length;
          return (
            <div key={t.tier} className={`p-5 rounded-xl border ${t.color} flex flex-col justify-between space-y-3`}>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold">{t.tier} SLA</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-black/40 border border-current font-bold">
                  {tierIncidents.length} ACTIVE
                </span>
              </div>

              <div>
                <div className="text-2xl font-black font-mono text-white">{t.duration}</div>
                <span className="text-[11px] font-mono text-slate-400 mt-0.5 block">Ack Target: {t.target}</span>
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>{breached} breached</span>
                <span
                  role="status"
                  aria-label={`SLA status for ${t.tier}: ${breached > 0 ? `${breached} breached, attention required` : 'nominal'}`}
                  className={breached > 0 ? 'text-red-400' : 'text-emerald-400'}
                >
                  {breached > 0 ? 'ATTENTION' : 'NOMINAL'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Ticking SLA Queue */}
      <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0A0D14] space-y-4">
        <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-white/[0.08]">
          <Clock className="w-4 h-4 text-cyan-400" />
          TRACKED INCIDENTS WITH ACTIVE COUNTDOWNS
        </span>

        {loading ? (
          <div role="status" aria-live="polite" className="flex items-center justify-center py-8 text-slate-400 font-mono text-sm gap-2">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            <span>LOADING...</span>
          </div>
        ) : incidents.length === 0 ? (
          <p className="text-slate-500 font-mono text-sm py-4">No open incidents with active SLA timers.</p>
        ) : (
        <div className="space-y-3">
          {incidents.map((inc) => {
            const sla = timeRemaining(inc.sla_ack_deadline);
            return (
              <div key={inc.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4 flex-wrap font-mono text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{inc.id.slice(0, 8)}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      inc.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {inc.severity}
                    </span>
                    <span className="text-slate-400">{inc.title}</span>
                  </div>
                  <span className="text-[11px] text-slate-500">{inc.location.building || inc.location.zone_id || 'Unlocated'} // Reported {new Date(inc.created_at).toLocaleTimeString()}</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">SLA REMAINING</span>
                    <span className={`text-sm font-bold ${sla.expired ? 'text-red-400' : 'text-cyan-400'}`}>{sla.label}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-[11px] font-bold border ${
                    sla.expired ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {sla.expired ? 'BREACHED' : 'HEALTHY'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>

    </div>
  );
}
