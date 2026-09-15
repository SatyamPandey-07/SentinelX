'use client';

import React from 'react';
import { ScrollText, ShieldCheck, Hash, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import { MOCK_AUDIT_LOGS } from '@/lib/mock-data';

export default function AuditTrailPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <span>IMMUTABLE AUDIT TRAIL</span>
            <span className="text-xs px-2.5 py-1 rounded-full font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              CHAIN INTEGRITY VERIFIED
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            CRYPTOGRAPHIC SHA-256 HASH CHAINING // APPEND-ONLY TAMPER-EVIDENT RECORD
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400">
          ALGORITHM: <strong className="text-slate-200">SHA-256 MERKLE LINK</strong>
        </div>
      </div>

      {/* Audit Log Entries */}
      <div className="space-y-3">
        {MOCK_AUDIT_LOGS.map((log, index) => (
          <div
            key={log.id}
            className="p-4 rounded-xl bg-surface border border-border space-y-3 font-mono text-xs"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-surface-elevated text-slate-400 font-bold">{log.id}</span>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold uppercase">{log.action}</span>
                <span className="text-slate-400">RESOURCE: {log.resource_type} // {log.resource_id}</span>
              </div>
              <span className="text-slate-500 text-[11px]">{new Date(log.occurred_at).toLocaleTimeString()} UTC</span>
            </div>

            {/* Principal & Role */}
            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              <span>PRINCIPAL: <strong className="text-slate-200">{log.principal_id}</strong></span>
              <span>ROLE: <strong className="text-slate-200">{log.principal_role}</strong></span>
            </div>

            {/* Cryptographic Hash Chain Badges */}
            <div className="p-3 rounded-lg bg-background/70 border border-border space-y-1.5 text-[10px]">
              <div className="flex items-center gap-2 text-slate-400">
                <LinkIcon className="w-3 h-3 text-slate-500 shrink-0" />
                <span className="text-slate-500">PREV HASH:</span>
                <span className="text-slate-400 truncate">{log.prev_hash}</span>
              </div>
              <div className="flex items-center gap-2 text-hud-cyan">
                <Hash className="w-3 h-3 text-hud-cyan shrink-0" />
                <span>CURR HASH:</span>
                <span className="font-bold truncate">{log.curr_hash}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 ml-auto shrink-0">
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
