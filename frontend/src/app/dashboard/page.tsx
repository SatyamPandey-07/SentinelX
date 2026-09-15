'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Flame, 
  HeartPulse, 
  ShieldAlert, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  UserCheck, 
  Radio, 
  TrendingUp, 
  ChevronRight,
  Plus,
  Cpu,
  Lock,
  Database,
  MapPin,
  Activity,
  Layers,
  Zap
} from 'lucide-react';
import { MOCK_INCIDENTS, MOCK_RESPONDERS } from '@/lib/mock-data';

export default function DashboardPage() {
  const [incidents, setIncidents] = useState(MOCK_INCIDENTS);
  const [responders, setResponders] = useState(MOCK_RESPONDERS);

  const criticalCount = incidents.filter(i => i.severity === 'CRITICAL' && i.status !== 'RESOLVED').length;
  const availableResponders = responders.filter(r => r.status === 'AVAILABLE').length;

  return (
    <div className="space-y-6">
      {/* Top Tactical Command Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black tracking-wider text-slate-100 uppercase font-mono">
              COMMAND TELEMETRY GRID
            </h1>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-2 flex-wrap">
            <span>CLUSTER: KRaft-01</span>
            <span className="text-slate-600">/</span>
            <span>OUTBOX: DRAINED (0 LAG)</span>
            <span className="text-slate-600">/</span>
            <span>REDIS MUTEX: ENGAGED</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/incidents"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold font-mono tracking-wider transition-all shadow-lg shadow-red-600/30 hover:shadow-red-600/50"
          >
            <Plus className="w-4 h-4" />
            <span>REPORT INCIDENT</span>
          </Link>
        </div>
      </div>

      {/* ========================================================
          BENTO GRID ARCHITECTURE (12-Column Responsive Layout)
          ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-fr">

        {/* BENTO 1: CRITICAL TRIAGE (Col Span 4) */}
        <div className="md:col-span-12 lg:col-span-4 bento-card bento-card-critical flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-widest text-red-400 uppercase font-bold flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-red-500 animate-pulse" />
              PRIORITY 1 ESCALATIONS
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-mono border border-red-500/30">
              URGENT
            </span>
          </div>

          <div className="my-4 flex items-baseline gap-3">
            <span className="text-4xl font-black text-red-400 font-mono">{criticalCount}</span>
            <span className="text-xs text-red-300/80 font-mono">ACTIVE SCENES REQUIRING DISPATCH</span>
          </div>

          <div className="pt-3 border-t border-red-950/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1 text-slate-300">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              Hazard: Chem Solvent Spill
            </span>
            <span className="text-red-400 font-bold">Zone North (Bldg 3)</span>
          </div>
        </div>

        {/* BENTO 2: RESPONDER FLEET & MUTEX LOCK (Col Span 4) */}
        <div className="md:col-span-12 sm:col-span-6 lg:col-span-4 bento-card bento-card-success flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-widest text-emerald-400 uppercase font-bold flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              RESPONDER READINESS
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30 flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-400" />
              MUTEX ACTIVE
            </span>
          </div>

          <div className="my-4 flex items-baseline gap-2">
            <span className="text-4xl font-black text-emerald-400 font-mono">{availableResponders}</span>
            <span className="text-base text-slate-400 font-mono">/ {responders.length}</span>
            <span className="text-xs text-emerald-400/80 font-mono ml-2">UNITS IN STANDBY</span>
          </div>

          <div className="pt-3 border-t border-emerald-950/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Concurrent Lock: Redis SETNX</span>
            <span className="text-emerald-300">0 Double Dispatches</span>
          </div>
        </div>

        {/* BENTO 3: SLA ENGINE (Col Span 4) */}
        <div className="md:col-span-12 sm:col-span-6 lg:col-span-4 bento-card bento-card-info flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-widest text-cyan-400 uppercase font-bold flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cyan-400" />
              SLA TIMER ENGINE
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
              NON-POLLING
            </span>
          </div>

          <div className="my-4 flex items-baseline gap-3">
            <span className="text-4xl font-black text-cyan-300 font-mono">98.4%</span>
            <span className="text-xs text-emerald-400 font-mono">+1.2% COMPLIANCE</span>
          </div>

          <div className="pt-3 border-t border-cyan-950/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Score: Redis ZSET (ms)</span>
            <span className="text-cyan-400">P95 MTTA: 1.8m</span>
          </div>
        </div>

        {/* BENTO 4: MAIN TACTICAL INCIDENT PIPELINE (Col Span 8, Row Span 2) */}
        <div className="md:col-span-12 lg:col-span-8 bento-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                <h2 className="text-sm font-bold tracking-wider text-slate-200 uppercase font-mono">
                  LIVE INCIDENT PIPELINE
                </h2>
              </div>
              <Link 
                href="/incidents" 
                className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 font-mono transition-colors"
              >
                <span>VIEW ROSTER</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {incidents.slice(0, 3).map((incident) => {
                const isCritical = incident.severity === 'CRITICAL';
                return (
                  <div
                    key={incident.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isCritical
                        ? 'bg-red-950/20 border-red-800/50 hover:border-red-600'
                        : 'bg-slate-900/80 border-slate-800/90 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-black text-slate-300">{incident.id}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                            incident.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                            incident.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                            'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                          }`}>
                            {incident.severity}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                            {incident.category}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 text-emerald-400 font-mono border border-emerald-500/30">
                            {incident.status}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-slate-100">{incident.title}</h3>
                        <p className="text-xs text-slate-400 line-clamp-1">{incident.description}</p>
                      </div>

                      <Link
                        href={`/incidents/${incident.id}`}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-950/80 hover:text-cyan-300 text-slate-200 text-xs font-mono font-bold transition-all border border-slate-700 shrink-0"
                      >
                        TRIAGE &rarr;
                      </Link>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-400 flex-wrap gap-2">
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                        {incident.location.building} (Floor {incident.location.floor})
                      </span>
                      <span className="text-cyan-400">UNIT: {incident.assigned_responder_name || 'AUTO-DISPATCHING...'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* BENTO 5: AI SAFETY GUARDRAILS & RAG (Col Span 4) */}
        <div className="md:col-span-12 lg:col-span-4 bento-card flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-[11px] font-mono tracking-widest text-slate-300 uppercase font-bold flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-cyan-400" />
                AI SAFETY DECISION ENGINE
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
                100% PASS
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Deterministic regex safety overrides enforce instant CRITICAL triage on life-threatening keywords, bypassing probabilistic hallucination.
            </p>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono">
                <span className="text-slate-400">Deterministic Safety:</span>
                <span className="text-emerald-400 font-bold">ENFORCED</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono">
                <span className="text-slate-400">Qdrant Grounded RAG:</span>
                <span className="text-cyan-300 font-bold">READY (5 SOPs)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono">
                <span className="text-slate-400">Zero-Shot Confidence:</span>
                <span className="text-slate-100 font-bold">1.0 (Safety Override)</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Strict zero-temperature generation ($T=0.0$)
          </div>
        </div>

        {/* BENTO 6: KAFKA EVENT STREAM TELEMETRY (Col Span 4) */}
        <div className="md:col-span-12 lg:col-span-4 bento-card flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-[11px] font-mono tracking-widest text-slate-300 uppercase font-bold flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-400" />
                KAFKA EVENT BACKBONE
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30">
                KRAFT
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Cluster ID:</span>
                <span className="text-slate-300 font-bold">MkU3OEVBNTcwNT...</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Partition Key:</span>
                <span className="text-purple-300">incident_id</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Consumer Ingestion:</span>
                <span className="text-emerald-400 font-bold">IDEMPOTENT (0 DUPES)</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Dead Letter Queue:</span>
                <span className="text-slate-400">notification.DLQ</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>Broker Latency: &lt; 2ms</span>
            <span className="text-emerald-400">HEALTHY</span>
          </div>
        </div>

        {/* BENTO 7: RESPONDER FLEET DEPLOYMENT (Col Span 8) */}
        <div className="md:col-span-12 lg:col-span-8 bento-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold tracking-wider text-slate-200 uppercase font-mono">
                  ACTIVE RESPONDER FLEET MATRIX
                </h2>
              </div>
              <Link href="/responders" className="text-xs text-slate-400 hover:text-emerald-400 font-mono flex items-center gap-1 transition-colors">
                <span>MANAGE FLEET</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {responders.map((resp) => (
                <div key={resp.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 font-mono">{resp.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                      resp.status === 'AVAILABLE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      resp.status === 'EN_ROUTE' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                      'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    }`}>
                      {resp.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {resp.skills.map((skill) => (
                      <span key={skill} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/60">
                    <span>ACTIVE LOAD: {resp.active_incidents}</span>
                    <span className="text-slate-300">TEL: {resp.phone}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
