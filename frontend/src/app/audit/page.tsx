'use client';

import React from 'react';
import { ScrollText, ShieldCheck, Hash, Link as LinkIcon, CheckCircle2, Lock, ShieldAlert, Database } from 'lucide-react';
import { MOCK_AUDIT_LOGS } from '@/lib/mock-data';

export default function AuditTrailPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5 font-mono uppercase">
            <span>CRYPTOGRAPHIC AUDIT LEDGER</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              CHAIN INTEGRITY VERIFIED
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            SHA-256 HASH CHAINING [Hn = SHA256(Hn-1 + Payload)] // TAMPER-EVIDENT LEDGER
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400">
          ALGORITHM: <strong className="text-purple-400">SHA-256 MERKLE LINK</strong>
        </div>
      </div>

      {/* ========================================================
          BENTO INTEGRITY ROW
          ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Bento 1: Chain Integrity */}
        <div className="bento-card bento-card-success flex flex-col justify-between">
          <span className="text-[11px] font-mono tracking-widest text-emerald-400 uppercase font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            MERKLE PROOF VERIFIED
          </span>
          <div className="my-3">
            <span className="text-3xl font-black text-emerald-400 font-mono">100.0%</span>
            <span className="text-xs text-emerald-300 font-mono block mt-1">Zero broken hash pointers</span>
          </div>
          <p className="text-[11px] font-mono text-slate-400 pt-2 border-t border-emerald-950/60">
            Validated against genesis block
          </p>
        </div>

        {/* Bento 2: Tamper Resistance */}
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

        {/* Bento 3: Genesis Parameters */}
        <div className="bento-card flex flex-col justify-between">
          <span className="text-[11px] font-mono tracking-widest text-slate-300 uppercase font-bold flex items-center gap-1.5">
            <Database className="w-4 h-4 text-purple-400" />
            BLOCK HEIGHT &amp; TOPOLOGY
          </span>
          <div className="my-3">
            <span className="text-3xl font-black text-purple-400 font-mono">BLOCK #142</span>
            <span className="text-xs text-slate-400 font-mono block mt-1">Genesis: 00000000...0000</span>
          </div>
          <p className="text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
            Events ingested via Kafka `audit.event`
          </p>
        </div>
      </div>

      {/* ========================================================
          BENTO AUDIT BLOCKS STREAM
          ======================================================== */}
      <div className="space-y-3">
        {MOCK_AUDIT_LOGS.map((log) => (
          <div
            key={log.id}
            className="bento-card p-4 space-y-3 font-mono text-xs"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">{log.id}</span>
                <span className="px-2.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold uppercase border border-cyan-500/30">
                  {log.action}
                </span>
                <span className="text-slate-400">RESOURCE: {log.resource_type} // {log.resource_id}</span>
              </div>
              <span className="text-slate-400 text-[11px]">{new Date(log.occurred_at).toLocaleTimeString()} UTC</span>
            </div>

            {/* Principal & Role */}
            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              <span>PRINCIPAL: <strong className="text-slate-200">{log.principal_id}</strong></span>
              <span>ROLE: <strong className="text-purple-300">{log.principal_role}</strong></span>
            </div>

            {/* Cryptographic Hash Chain Badges */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-[10px]">
              <div className="flex items-center gap-2 text-slate-400">
                <LinkIcon className="w-3 h-3 text-slate-500 shrink-0" />
                <span className="text-slate-500">PREV HASH:</span>
                <span className="text-slate-400 truncate">{log.prev_hash}</span>
              </div>
              <div className="flex items-center gap-2 text-cyan-300">
                <Hash className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>CURR HASH:</span>
                <span className="font-bold truncate text-slate-200">{log.curr_hash}</span>
                <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 ml-auto shrink-0 border border-emerald-500/30">
                  SIGNED
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
