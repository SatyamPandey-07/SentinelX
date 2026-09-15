'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Flame, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  UserCheck, 
  AlertCircle, 
  Bot, 
  ShieldCheck,
  Send,
  Building,
  FileText,
  Lock,
  Hash,
  Database,
  Layers,
  Sparkles
} from 'lucide-react';
import { MOCK_INCIDENTS, Incident } from '@/lib/mock-data';

export default function IncidentDetailPage({ params }: { params: { id: string } }) {
  const incidentId = params.id;
  const initialIncident = MOCK_INCIDENTS.find(i => i.id === incidentId) || MOCK_INCIDENTS[0];
  const [incident, setIncident] = useState<Incident>(initialIncident);
  
  // RAG query state
  const [ragQuery, setRagQuery] = useState('');
  const [ragAnswer, setRagAnswer] = useState<string | null>(null);
  const [ragLoading, setRagLoading] = useState(false);

  const handleAcknowledge = () => {
    setIncident({
      ...incident,
      status: 'ACKNOWLEDGED',
      acknowledged_at: new Date().toISOString()
    });
  };

  const handleResolve = () => {
    setIncident({
      ...incident,
      status: 'RESOLVED',
      resolved_at: new Date().toISOString()
    });
  };

  const handleRagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ragQuery.trim()) return;
    setRagLoading(true);

    setTimeout(() => {
      setRagAnswer(
        `According to Campus Emergency Policy SOP-03 (Section 4.2 - Laboratory Spill Exclusion):\n\n"In the event of a volatile chemical or acid spill exceeding 500 mL, evacuate laboratory immediately, close the door, and alert campus safety. Do not attempt cleanup without Level B protective gear. Turn off local HVAC recirculation if accessible, and establish a 100-meter exclusion boundary upwind."\n\nCitation: Campus Chemical & Toxic Fume Containment Protocol (SOP-03) // Relevance Score: 0.94 // Zero Temperature ($T=0.0$)`
      );
      setRagLoading(false);
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Back button & Status bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href="/incidents"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-slate-400">DOSSIER:</span>
              <span className="text-sm font-black font-mono text-slate-100">{incident.id}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                incident.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                incident.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
              }`}>
                {incident.severity}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {incident.status}
              </span>
            </div>
            <h1 className="text-lg font-bold text-slate-100 mt-1">{incident.title}</h1>
          </div>
        </div>

        {/* Operational Quick Actions */}
        <div className="flex items-center gap-3">
          {incident.status !== 'RESOLVED' && (
            <>
              {incident.status !== 'ACKNOWLEDGED' && (
                <button
                  onClick={handleAcknowledge}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold font-mono flex items-center gap-1.5 transition-all shadow-md shadow-cyan-600/30"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ACKNOWLEDGE</span>
                </button>
              )}
              <button
                onClick={handleResolve}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/30"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>RESOLVE INCIDENT</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ========================================================
          INCIDENT DETAIL BENTO GRID
          ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

        {/* BENTO 1: INCIDENT SUMMARY & NARRATIVE (Col 8) */}
        <div className="md:col-span-12 lg:col-span-8 bento-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-[11px] font-mono tracking-widest text-slate-300 uppercase font-bold flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-cyan-400" />
              TRIAGE BRIEFING &amp; DISPATCH CONTEXT
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              REPORTER: {incident.reporter_id}
            </span>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-100">{incident.title}</h2>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed whitespace-pre-line bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 font-mono">
              {incident.description}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] uppercase block">Location Coordinates</span>
              <span className="text-slate-200 font-bold block">{incident.location.building}</span>
              <span className="text-slate-400 text-[11px]">{incident.location.floor} // {incident.location.zone_id}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] uppercase block">Category &amp; Hazard</span>
              <span className="text-cyan-400 font-bold block">{incident.category}</span>
              <span className="text-slate-400 text-[11px]">Level 2 Response</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] uppercase block">Outbox Transaction</span>
              <span className="text-emerald-400 font-bold block">COMMITTED</span>
              <span className="text-slate-400 text-[11px]">Kafka ACK Verified</span>
            </div>
          </div>
        </div>

        {/* BENTO 2: SLA MONITOR & TELEMETRY (Col 4) */}
        <div className="md:col-span-12 lg:col-span-4 bento-card bento-card-info flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-cyan-950/60">
              <span className="text-[11px] font-mono tracking-widest text-cyan-300 uppercase font-bold flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-400" />
                SLA EVALUATION
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                ACTIVE
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Target Ack SLA:</span>
                <span className="text-slate-200 font-bold">2 minutes (CRITICAL)</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Deadline Score:</span>
                <span className="text-cyan-400 font-mono">Redis ZSET (ms)</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Warning Threshold:</span>
                <span className="text-amber-300">80% of elapsed time</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-cyan-950/60 mt-4">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 uppercase">
                <Hash className="w-3.5 h-3.5 text-purple-400" />
                <span>Cryptographic Audit Hash Chain</span>
              </div>
              <p className="text-[10px] font-mono text-purple-300 break-all">
                SHA256: 8a94bc12f...4d91e80
              </p>
            </div>
          </div>
        </div>

        {/* BENTO 3: ASSIGNED UNIT STATUS (Col 4) */}
        <div className="md:col-span-12 lg:col-span-4 bento-card bento-card-success flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-950/60">
              <span className="text-[11px] font-mono tracking-widest text-emerald-300 uppercase font-bold flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                DISPATCHED UNIT
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                LOCKED
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-100 font-mono">
                {incident.assigned_responder_name || 'Captain Elena Vance'}
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Specialization: FIRE / HAZMAT</p>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-400">
                <span>Dispatch Distance:</span>
                <span className="text-slate-200">180m (Haversine gRPC)</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Concurrency Mutex:</span>
                <span className="text-emerald-400">Redis SETNX (10s TTL)</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-emerald-950/60 text-[11px] font-mono text-emerald-400">
            Status: EN_ROUTE TO SCENE
          </div>
        </div>

        {/* BENTO 4: GROUNDED RAG KNOWLEDGE ASSISTANT (Col 8) */}
        <div className="md:col-span-12 lg:col-span-8 bento-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold tracking-wider text-slate-200 uppercase font-mono">
                GROUNDED RAG EMERGENCY ASSISTANT (QDRANT VECTOR DB)
              </h2>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono border border-slate-700">
              ZERO-TEMP (T=0.0)
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Ask operational containment protocols, evacuation parameters, or SOP checklists. Answers are strictly grounded in official campus emergency binders.
          </p>

          <form onSubmit={handleRagSubmit} className="flex gap-2">
            <input
              type="text"
              value={ragQuery}
              onChange={(e) => setRagQuery(e.target.value)}
              placeholder="e.g. How to neutralize acid spill in chemistry laboratory?"
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <button
              type="submit"
              disabled={ragLoading}
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{ragLoading ? 'SEARCHING...' : 'QUERY SOP'}</span>
            </button>
          </form>

          {ragAnswer && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30 text-xs text-slate-300 font-mono space-y-2">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase text-[11px]">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                VERIFIED EMERGENCY PROTOCOL
              </div>
              <p className="leading-relaxed whitespace-pre-line text-slate-200">{ragAnswer}</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
