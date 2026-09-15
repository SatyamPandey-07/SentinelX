'use client';

import React from 'react';
import { Activity, Server, Cpu, Layers, Database, Radio, CheckCircle2, Shield, Zap } from 'lucide-react';
import { MOCK_SERVICES_HEALTH } from '@/lib/mock-data';

export default function SystemHealthPage() {
  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5 font-mono uppercase">
            <span>ADMIN // SYSTEM HEALTH &amp; SERVICE MESH</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              ALL SERVICES NOMINAL
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            DISTRIBUTED OPENTELEMETRY TRACING // PROMETHEUS SCRAPE METRICS // 0 CRITICAL CVEs
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400">
          CLUSTER: <strong className="text-white">sentinelx-prod (AWS EKS)</strong>
        </div>
      </div>

      {/* Telemetry HUD Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl border border-white/[0.08] bg-[#0A0D14] space-y-1 font-mono">
          <span className="text-[10px] uppercase text-slate-400">REQUEST RATE</span>
          <div className="text-2xl font-black text-white">2.4k req/s</div>
          <span className="text-[10px] text-emerald-400">Spring Cloud Gateway</span>
        </div>

        <div className="p-4 rounded-xl border border-white/[0.08] bg-[#0A0D14] space-y-1 font-mono">
          <span className="text-[10px] uppercase text-slate-400">P95 LATENCY</span>
          <div className="text-2xl font-black text-cyan-400">182ms</div>
          <span className="text-[10px] text-slate-500">Target &lt; 300ms</span>
        </div>

        <div className="p-4 rounded-xl border border-white/[0.08] bg-[#0A0D14] space-y-1 font-mono">
          <span className="text-[10px] uppercase text-slate-400">KAFKA CONSUMER LAG</span>
          <div className="text-2xl font-black text-emerald-400">12ms</div>
          <span className="text-[10px] text-slate-500">0 partitions stuck</span>
        </div>

        <div className="p-4 rounded-xl border border-white/[0.08] bg-[#0A0D14] space-y-1 font-mono">
          <span className="text-[10px] uppercase text-slate-400">REDIS HIT RATE</span>
          <div className="text-2xl font-black text-purple-400">94.8%</div>
          <span className="text-[10px] text-slate-500">Cache-aside layer</span>
        </div>

        <div className="p-4 rounded-xl border border-white/[0.08] bg-[#0A0D14] space-y-1 font-mono">
          <span className="text-[10px] uppercase text-slate-400">AI LATENCY</span>
          <div className="text-2xl font-black text-amber-400">713ms</div>
          <span className="text-[10px] text-slate-500">Zero-Shot + RAG</span>
        </div>
      </div>

      {/* Microservices Health Table */}
      <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0A0D14] space-y-4">
        <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-white/[0.08]">
          <Server className="w-4 h-4 text-cyan-400" />
          MICROSERVICE COMPONENT REGISTRY (11 RUNNING)
        </span>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-slate-500 text-[10px]">
                <th className="pb-3 font-semibold">SERVICE COMPONENT</th>
                <th className="pb-3 font-semibold">STATUS</th>
                <th className="pb-3 font-semibold">P95 LATENCY</th>
                <th className="pb-3 font-semibold">CPU LOAD</th>
                <th className="pb-3 font-semibold">MEMORY</th>
                <th className="pb-3 font-semibold">CONSUMER LAG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-slate-300">
              {MOCK_SERVICES_HEALTH.map((s) => (
                <tr key={s.name} className="hover:bg-white/[0.02]">
                  <td className="py-3 font-bold text-white flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    {s.name}
                  </td>
                  <td className="py-3">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 text-cyan-400">{s.p95}</td>
                  <td className="py-3 text-slate-300">{s.cpu}</td>
                  <td className="py-3 text-slate-400">{s.mem}</td>
                  <td className="py-3 text-emerald-400">{s.lag}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
