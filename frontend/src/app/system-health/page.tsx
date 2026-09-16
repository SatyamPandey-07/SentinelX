'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Server, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { probeServiceHealth, SERVICE_PORTS } from '@/lib/api';

interface ProbeResult {
  service: string;
  up: boolean;
  latencyMs: number | null;
}

export default function SystemHealthPage() {
  const [results, setResults] = useState<ProbeResult[]>([]);
  const [loading, setLoading] = useState(true);

  const probeAll = useCallback(async () => {
    const entries = Object.entries(SERVICE_PORTS);
    const out = await Promise.all(entries.map(([name, port]) => probeServiceHealth(name, port)));
    setResults(out);
    setLoading(false);
  }, []);

  useEffect(() => {
    probeAll();
    const poll = setInterval(probeAll, 10000);
    return () => clearInterval(poll);
  }, [probeAll]);

  const healthyCount = results.filter((r) => r.up).length;
  const allNominal = results.length > 0 && healthyCount === results.length;
  const avgLatency = results.filter((r) => r.latencyMs !== null).length
    ? Math.round(results.reduce((s, r) => s + (r.latencyMs ?? 0), 0) / results.filter((r) => r.latencyMs !== null).length)
    : 0;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5 font-mono uppercase">
            <span>ADMIN // SYSTEM HEALTH &amp; SERVICE MESH</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono border flex items-center gap-1 ${
              allNominal ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              {allNominal ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
              {healthyCount}/{results.length} SERVICES UP
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            LIVE: each row is a real browser round-trip to that service's own /actuator/health (or /health for ai-service)
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400">
          MEAN PROBE LATENCY: <strong className="text-cyan-400">{avgLatency}ms</strong>
        </div>
      </div>

      {/* Microservices Health Table */}
      <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0A0D14] space-y-4">
        <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-white/[0.08]">
          <Server className="w-4 h-4 text-cyan-400" />
          MICROSERVICE COMPONENT REGISTRY ({results.length} PROBED)
        </span>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-slate-400 font-mono text-sm gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            PROBING SERVICES...
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-slate-500 text-[10px]">
                <th className="pb-3 font-semibold">SERVICE COMPONENT</th>
                <th className="pb-3 font-semibold">PORT</th>
                <th className="pb-3 font-semibold">STATUS</th>
                <th className="pb-3 font-semibold">PROBE LATENCY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-slate-300">
              {results.map((r) => (
                <tr key={r.service} className="hover:bg-white/[0.02]">
                  <td className="py-3 font-bold text-white flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${r.up ? 'bg-emerald-400' : 'bg-red-500'}`}></span>
                    {r.service}
                  </td>
                  <td className="py-3 text-slate-500">{SERVICE_PORTS[r.service]}</td>
                  <td className="py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${
                      r.up ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'
                    }`}>
                      {r.up ? 'HEALTHY' : 'UNREACHABLE'}
                    </span>
                  </td>
                  <td className="py-3 text-cyan-400">{r.latencyMs !== null ? `${r.latencyMs}ms` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

    </div>
  );
}
