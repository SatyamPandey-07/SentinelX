'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { BarChart3, Activity, Cpu, Database, Loader2, AlertTriangle } from 'lucide-react';
import { getAnalyticsOverview, AnalyticsOverview, ApiError } from '@/lib/api';

const SEVERITY_COLOR: Record<string, { bar: string; text: string }> = {
  CRITICAL: { bar: 'bg-red-500', text: 'text-red-400' },
  HIGH: { bar: 'bg-amber-500', text: 'text-amber-400' },
  MEDIUM: { bar: 'bg-cyan-500', text: 'text-cyan-400' },
  LOW: { bar: 'bg-emerald-500', text: 'text-emerald-400' },
};

function fmtSeconds(s: number) {
  if (s < 60) return `${s.toFixed(0)}s`;
  return `${(s / 60).toFixed(1)}m`;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await getAnalyticsOverview());
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Unable to reach analytics-service');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const poll = setInterval(load, 15000);
    return () => clearInterval(poll);
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400 font-mono text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        LOADING ANALYTICS OVERVIEW...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        {error || 'No data'}
      </div>
    );
  }

  const categoryEntries = Object.entries(data.by_category).sort((a, b) => b[1] - a[1]);
  const severityEntries = Object.entries(data.by_severity).sort((a, b) => b[1] - a[1]);
  const categoryMax = Math.max(...categoryEntries.map(([, v]) => v), 1);
  const severityTotal = severityEntries.reduce((s, [, v]) => s + v, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5 font-mono uppercase">
            <span>OPERATIONAL ANALYTICS &amp; METRICS</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-mono border border-slate-700">
              LIVE
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            GET /api/v1/analytics/overview // Redis-cached 60s TTL, event-driven CQRS read model
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
          <Cpu className="w-3.5 h-3.5" />
          <span>REDIS CACHE ACTIVE (TTL: 60s)</span>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bento-card bento-card-success flex flex-col justify-between">
          <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">SLA Compliance Rate</span>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400 font-mono">{data.sla_compliance_percent.toFixed(1)}%</span>
          </div>
          <p className="text-[11px] font-mono text-slate-400 pt-2 border-t border-emerald-950/60">
            {data.sla_breached_count} breach(es) out of {data.total_incidents} tracked incidents
          </p>
        </div>

        <div className="bento-card bento-card-info flex flex-col justify-between">
          <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">P95 Response Latency</span>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-cyan-400 font-mono">{fmtSeconds(data.response_time_seconds.p95)}</span>
            <span className="text-xs text-slate-400 font-mono">P50: {fmtSeconds(data.response_time_seconds.median)}</span>
          </div>
          <p className="text-[11px] font-mono text-slate-400 pt-2 border-t border-cyan-950/60">
            Report to acknowledgement
          </p>
        </div>

        <div className="bento-card flex flex-col justify-between">
          <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">Mean Time to Resolve</span>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-purple-400 font-mono">{fmtSeconds(data.resolution_time_seconds.average)}</span>
          </div>
          <p className="text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
            Dispatch to final scene closure
          </p>
        </div>

        <div className="bento-card flex flex-col justify-between">
          <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">Total Incidents</span>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-400 font-mono">{data.total_incidents}</span>
          </div>
          <p className="text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
            All-time, this Redis-cached window
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 bento-card space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-[11px] font-mono tracking-widest text-slate-300 uppercase font-bold flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              INCIDENT VOLUME BY CATEGORY
            </span>
            <span className="text-[10px] font-mono text-slate-400">ALL TIME</span>
          </div>

          {categoryEntries.length === 0 ? (
            <p className="text-slate-500 font-mono text-xs py-4">No incidents recorded yet.</p>
          ) : (
          <div className="space-y-3.5 pt-1">
            {categoryEntries.map(([label, count]) => (
              <div key={label} className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold">{label}</span>
                  <span className="text-cyan-400">{count} incident{count === 1 ? '' : 's'}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${(count / categoryMax) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>

        <div className="lg:col-span-5 bento-card space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-[11px] font-mono tracking-widest text-slate-300 uppercase font-bold flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-red-400" />
              SEVERITY DISTRIBUTION MATRIX
            </span>
            <span className="text-[10px] font-mono text-slate-400">TOTAL: {severityTotal}</span>
          </div>

          <div className="space-y-3 pt-1">
            {severityEntries.map(([label, count]) => {
              const c = SEVERITY_COLOR[label] ?? SEVERITY_COLOR.MEDIUM;
              return (
                <div key={label} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${c.bar}`}></span>
                    <span className="text-slate-200 font-bold">{label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">{((count / severityTotal) * 100).toFixed(0)}%</span>
                    <span className={`font-black ${c.text}`}>{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

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
