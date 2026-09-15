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
  FileText
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
        `According to Campus Emergency Policy SOP-03 (Section 4.2 - Laboratory Spill Exclusion):\n\n"In the event of a volatile chemical or acid spill exceeding 500 mL, evacuate laboratory immediately, close the door, and alert campus safety. Do not attempt cleanup without Level B protective gear. Turn off local HVAC recirculation if accessible, and establish a 100-meter exclusion boundary upwind."\n\nCitation: Campus Chemical & Toxic Fume Containment Protocol (SOP-03) // Relevance Score: 0.94`
      );
      setRagLoading(false);
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back button & Status bar */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link
            href="/incidents"
            className="p-2 rounded-lg bg-surface hover:bg-surface-elevated text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">INCIDENT ID:</span>
              <span className="text-sm font-bold font-mono text-slate-100">{incident.id}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                incident.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                incident.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                'bg-blue-500/20 text-blue-400 border border-blue-500/40'
              }`}>
                {incident.severity}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-blue-500/20 text-blue-300">
                {incident.status}
              </span>
            </div>
            <h1 className="text-base font-bold text-slate-100 mt-1">{incident.title}</h1>
          </div>
        </div>

        {/* Operational Quick Actions */}
        <div className="flex items-center gap-3">
          {incident.status !== 'RESOLVED' && (
            <>
              {incident.status !== 'ACKNOWLEDGED' && (
                <button
                  onClick={handleAcknowledge}
                  className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold font-mono flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>ACKNOWLEDGE</span>
                </button>
              )}

              <button
                onClick={handleResolve}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold font-mono flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>RESOLVE INCIDENT</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2-Column Incident Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Incident Details & Grounded RAG Assistant */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Description & Triage Card */}
          <div className="p-5 rounded-xl bg-surface border border-border space-y-4">
            <h2 className="text-xs font-mono font-semibold uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-hud-cyan" />
              <span>INCIDENT STATEMENT &amp; FIELD OBSERVATIONS</span>
            </h2>
            <p className="text-sm text-slate-200 leading-relaxed bg-background/50 p-4 rounded-lg border border-border">
              {incident.description}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-surface-elevated border border-border">
                <span className="text-slate-400 block text-[10px]">CATEGORY</span>
                <span className="text-slate-200 font-semibold">{incident.category}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-elevated border border-border">
                <span className="text-slate-400 block text-[10px]">REPORTER ID</span>
                <span className="text-slate-200 font-semibold">{incident.reporter_id}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-elevated border border-border">
                <span className="text-slate-400 block text-[10px]">TIMESTAMP</span>
                <span className="text-slate-200 font-semibold">{new Date(incident.created_at).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          {/* AI Insights & Safety Guardrail Verification */}
          <div className="p-5 rounded-xl bg-surface border border-border space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h2 className="text-xs font-mono font-semibold uppercase text-slate-200 tracking-wider flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-400" />
                <span>AI CLASSIFICATION &amp; SAFETY OVERRIDE</span>
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                DETERMINISTIC SAFETY ENFORCED
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-purple-950/20 border border-purple-500/30 text-slate-300 space-y-1">
                <div className="font-mono text-purple-300 font-semibold text-[11px]">REASONING ENGINE:</div>
                <p>
                  Safety rule applied: Hazardous material / airborne toxic substance identified. Immediate containment and Level B personal protective equipment required.
                </p>
              </div>

              <div className="space-y-1.5 font-mono text-[11px]">
                <span className="text-slate-400 uppercase">MANDATORY PROTOCOL ACTIONS:</span>
                <ul className="space-y-1 list-disc list-inside text-slate-300">
                  <li>Dispatch specialized hazmat response team in Level B suits</li>
                  <li>Isolate room and shut down localized recirculating airflow</li>
                  <li>Establish 100-meter exclusion perimeter upwind</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Grounded RAG Emergency Procedure Assistant */}
          <div className="p-5 rounded-xl bg-surface border border-border space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h2 className="text-xs font-mono font-semibold uppercase text-slate-200 tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-hud-cyan" />
                <span>GROUNDED RAG EMERGENCY POLICY ASSISTANT</span>
              </h2>
              <span className="text-[10px] font-mono text-slate-400">QDRANT VECTOR STORE</span>
            </div>

            <form onSubmit={handleRagSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Ask official campus SOP (e.g. What is the evacuation radius for chemical spills?)"
                value={ragQuery}
                onChange={(e) => setRagQuery(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-lg bg-surface-elevated border border-border text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={ragLoading}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{ragLoading ? 'SEARCHING...' : 'QUERY SOP'}</span>
              </button>
            </form>

            {ragAnswer && (
              <div className="p-4 rounded-lg bg-background/60 border border-hud-cyan/30 space-y-2 text-xs">
                <div className="font-mono text-hud-cyan text-[11px] font-semibold flex items-center gap-1.5">
                  <span>GROUNDED POLICY GUIDANCE</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-hud-cyan/20 text-hud-cyan">VERIFIED CITATION</span>
                </div>
                <p className="text-slate-200 whitespace-pre-line leading-relaxed font-sans">{ragAnswer}</p>
                <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-border">
                  DISCLAIMER: Always follow live incident commander directives.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Assigned Responder & Location */}
        <div className="space-y-6">
          {/* Responder Assignment Card */}
          <div className="p-5 rounded-xl bg-surface border border-border space-y-4">
            <h2 className="text-xs font-mono font-semibold uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>ASSIGNED RESPONDER UNIT</span>
            </h2>

            {incident.assigned_responder_name ? (
              <div className="p-4 rounded-lg bg-surface-elevated border border-emerald-500/30 space-y-3 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100">{incident.assigned_responder_name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">DISPATCHED</span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  <span>UNIT ID: {incident.assigned_responder_id}</span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  <span>DISTANCE: 320 METERS (HAUL TIME ~2.5 MIN)</span>
                </div>
                <div className="pt-2 border-t border-border flex items-center justify-between text-slate-300">
                  <span>DISPATCH LOCK:</span>
                  <span className="text-emerald-400">REDIS SETNX CLAIMED</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-surface-elevated border border-border text-center text-xs text-slate-400 font-mono">
                Awaiting algorithmic assignment...
              </div>
            )}
          </div>

          {/* Location & Geofencing Card */}
          <div className="p-5 rounded-xl bg-surface border border-border space-y-3">
            <h2 className="text-xs font-mono font-semibold uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4 text-hud-cyan" />
              <span>CAMPUS GEOLOCATION PIN</span>
            </h2>

            <div className="p-3.5 rounded-lg bg-surface-elevated border border-border text-xs font-mono space-y-1.5">
              <div className="text-slate-200 font-semibold">{incident.location.building}</div>
              <div className="text-slate-400">{incident.location.floor} // {incident.location.address}</div>
              <div className="text-[11px] text-hud-cyan pt-1">
                COORDINATES: {incident.location.latitude.toFixed(4)}, {incident.location.longitude.toFixed(4)}
              </div>
              <div className="text-[11px] text-slate-400">
                GEOFENCED ZONE: {incident.location.zone_id}
              </div>
            </div>

            {/* Campus Mini Map representation */}
            <div className="h-36 rounded-lg bg-slate-900 border border-border relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>
              <div className="z-10 flex flex-col items-center gap-1">
                <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center text-red-400 pulse-critical">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-mono text-slate-300 bg-black/60 px-2 py-0.5 rounded">
                  {incident.location.building}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
