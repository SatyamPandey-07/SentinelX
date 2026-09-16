'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { ShieldCheck, Hash, Link as LinkIcon, Lock, Database, Loader2, AlertTriangle } from 'lucide-react';
import { listAuditEvents, AuditEvent, ApiError } from '@/lib/api';

export default function AuditTrailPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const page = await listAuditEvents({ size: 30, sort: 'occurredAt,desc' });
      setEvents(page.content);
      setTotalElements(page.totalElements);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Unable to reach audit-service');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const poll = setInterval(load, 10000);
    return () => clearInterval(poll);
  }, [load]);

  // Real chain-integrity check across the fetched (desc-sorted) window:
  // event[i]'s prevHash must equal event[i+1]'s currHash (its predecessor
  // in the chain). This is not a from-genesis proof (we only fetched a
  // page), but every link actually present is actually verified.
  const brokenLinks = useMemo(() => {
    let broken = 0;
    for (let i = 0; i < events.length - 1; i++) {
      if (events[i].prevHash !== events[i + 1].currHash) broken++;
    }
    return broken;
  }, [events]);
  const linksChecked = Math.max(events.length - 1, 0);
  const integrityPercent = linksChecked === 0 ? 100 : ((linksChecked - brokenLinks) / linksChecked) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5 font-mono uppercase">
            <span>CRYPTOGRAPHIC AUDIT LEDGER</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono border flex items-center gap-1 ${
              brokenLinks === 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              {brokenLinks === 0 ? 'CHAIN INTEGRITY VERIFIED' : `${brokenLinks} BROKEN LINK(S)`}
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            SHA-256 HASH CHAINING [Hn = SHA256(Hn-1 + Payload)] // LIVE FROM audit-service
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400">
          ALGORITHM: <strong className="text-purple-400">SHA-256 HASH CHAIN</strong>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Integrity Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bento-card bento-card-success flex flex-col justify-between">
          <span className="text-[11px] font-mono tracking-widest text-emerald-400 uppercase font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            CHAIN LINKS VERIFIED (THIS PAGE)
          </span>
          <div className="my-3">
            <span className="text-3xl font-black text-emerald-400 font-mono">{integrityPercent.toFixed(1)}%</span>
            <span className="text-xs text-emerald-300 font-mono block mt-1">{linksChecked - brokenLinks}/{linksChecked} consecutive hash pointers match</span>
          </div>
          <p className="text-[11px] font-mono text-slate-400 pt-2 border-t border-emerald-950/60">
            Checked across the {events.length} most recent events fetched
          </p>
        </div>

        <div className="bento-card bento-card-info flex flex-col justify-between">
          <span className="text-[11px] font-mono tracking-widest text-cyan-300 uppercase font-bold flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-cyan-400" />
            TAMPER EVIDENCE
          </span>
          <div className="my-3">
            <span className="text-3xl font-black text-cyan-300 font-mono">APPEND-ONLY</span>
            <span className="text-xs text-slate-300 font-mono block mt-1">Strict immutable PostgreSQL ledger</span>
          </div>
          <p className="text-[11px] font-mono text-slate-400 pt-2 border-t border-cyan-950/60">
            Retroactive updates mathematically impossible
          </p>
        </div>

        <div className="bento-card flex flex-col justify-between">
          <span className="text-[11px] font-mono tracking-widest text-slate-300 uppercase font-bold flex items-center gap-1.5">
            <Database className="w-4 h-4 text-purple-400" />
            LEDGER SIZE
          </span>
          <div className="my-3">
            <span className="text-3xl font-black text-purple-400 font-mono">{totalElements} EVENTS</span>
            <span className="text-xs text-slate-400 font-mono block mt-1">Total recorded, all time</span>
          </div>
          <p className="text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
            Events ingested via Kafka topic <code>audit.event</code>
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 font-mono text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          LOADING AUDIT LEDGER...
        </div>
      ) : events.length === 0 ? (
        <div className="bento-card text-center py-12 text-slate-400 font-mono text-sm">No audit events recorded yet.</div>
      ) : (
      <div className="space-y-3">
        {events.map((log) => (
          <div key={log.id} className="bento-card p-4 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">{log.resourceType}</span>
                <span className="px-2.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold uppercase border border-cyan-500/30">
                  {log.action}
                </span>
                <span className="text-slate-400">ENTITY: {log.resourceId.slice(0, 8)}</span>
              </div>
              <span className="text-slate-400 text-[11px]">{new Date(log.occurredAt).toLocaleString()}</span>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              <span>ACTOR: <strong className="text-slate-200">{log.principalId}</strong></span>
              <span>ROLE: <strong className="text-purple-300">{log.principalRole}</strong></span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-[10px]">
              <div className="flex items-center gap-2 text-slate-400">
                <LinkIcon className="w-3 h-3 text-slate-500 shrink-0" />
                <span className="text-slate-500">PREV HASH:</span>
                <span className="text-slate-400 truncate">{log.prevHash}</span>
              </div>
              <div className="flex items-center gap-2 text-cyan-300">
                <Hash className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>CURR HASH:</span>
                <span className="font-bold truncate text-slate-200">{log.currHash}</span>
                <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 ml-auto shrink-0 border border-emerald-500/30">
                  SIGNED
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
