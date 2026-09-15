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
  Sparkles,
  ChevronRight,
  Shield,
  Activity
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
      acknowledged_at: "14:34:12"
    });
  };

  const handleResolve = () => {
    setIncident({
      ...incident,
      status: 'RESOLVED',
      resolved_at: new Date().toLocaleTimeString()
    });
  };

  const handleRagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ragQuery.trim()) return;
    setRagLoading(true);

    setTimeout(() => {
      setRagAnswer(
        `According to Medical Emergency & AED Deployment Protocol (SOP-04):\n\n"For unconscious individuals or suspected cardiac arrest: 1) Verify responsiveness and normal breathing. 2) Immediately call Campus Dispatch (ext. 911/5555). 3) Retrieve the nearest Automated External Defibrillator (AED located near central elevators). 4) Begin chest compressions at 100-120 bpm at 2 inches depth until EMS arrives."\n\nCitation: Campus Medical SOP-04 // Section 1.4 // Zero-Temperature ($T=0.0$)`
      );
      setRagLoading(false);
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold border border-red-500/30">
                CRITICAL INCIDENT
              </span>
              <span className="text-base font-black font-mono text-white">{incident.id}</span>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {incident.status}
              </span>
            </div>
            <h1 className="text-xl font-bold text-white mt-1">{incident.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {incident.status !== 'RESOLVED' && (
            <>
              {incident.status !== 'ACKNOWLEDGED' && (
                <button
                  onClick={handleAcknowledge}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold font-mono transition-colors"
                >
                  ACKNOWLEDGE
                </button>
              )}
              <button
                onClick={handleResolve}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono transition-colors"
              >
                RESOLVE INCIDENT
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2-Column Incident Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT (7 Cols): TIMELINE & AI CLASSIFICATION */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* AI Classification Dossier */}
          <div className="p-5 rounded-xl border border-white/[0.08] bg-[#0A0D14] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                AI CLASSIFICATION &amp; SAFETY REASONING
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-500/30">
                CONFIDENCE: {incident.ai_confidence || 97.4}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-slate-500 text-[10px] block">CATEGORY</span>
                <span className="text-white font-bold">{incident.category} Emergency</span>
              </div>
              <div className="p-3 rounded-lg bg-red-950/20 border border-red-500/30">
                <span className="text-red-400 text-[10px] block">SEVERITY</span>
                <span className="text-red-400 font-bold">{incident.severity}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <span className="text-slate-400 font-bold">RECOMMENDED ACTIONS:</span>
              <ul className="space-y-1.5">
                {(incident.recommended_actions || [
                  "Dispatch medical responder and campus EMS with AED kit",
                  "Notify campus security to secure building perimeter and elevator priority",
                  "Keep nearby hallway and stairwell clear for paramedic stretcher access"
                ]).map((act, i) => (
                  <li key={i} className="text-slate-300 flex items-start gap-2 text-[11px]">
                    <span className="text-cyan-400 font-bold font-mono">{i + 1}.</span>
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 rounded-lg bg-[#080B10] border border-slate-800 text-[11px] font-mono space-y-1">
              <span className="text-slate-400 font-bold uppercase block text-[10px]">AI REASONING:</span>
              <p className="text-slate-300 leading-relaxed text-[10px]">
                {incident.ai_reasoning || "Matched high-consequence medical pattern 'unconscious' and 'shallow breathing'. Deterministic rule applied instant CRITICAL severity triage."}
              </p>
            </div>
          </div>

          {/* Incident Timeline */}
          <div className="p-5 rounded-xl border border-white/[0.08] bg-[#0A0D14] space-y-4">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 pb-3 border-b border-white/[0.08]">
              <Clock className="w-4 h-4 text-cyan-400" />
              INCIDENT EVENT TIMELINE
            </span>

            <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/[0.08] pl-6">
              {(incident.timeline || [
                { timestamp: "14:32", title: "Incident reported", description: "Submitted via campus emergency mobile app", actor: "usr-student-89" },
                { timestamp: "14:32", title: "AI classified", description: "Classified as CRITICAL MEDICAL (Confidence 97.4%)", actor: "VIGIL AI Engine" },
                { timestamp: "14:33", title: "Responder assigned", description: "Automated scoring matched nearest unit #R-104 (320m)", actor: "Assignment Service" },
                { timestamp: "14:34", title: "Incident acknowledged", description: "Responder #R-104 confirmed dispatch en route", actor: "Responder #R-104" },
                { timestamp: "14:38", title: "Responder arrived", description: "Unit on scene at Engineering Block A, Floor 2", actor: "Responder #R-104" }
              ]).map((t, idx) => (
                <div key={idx} className="relative space-y-1 text-xs font-mono">
                  <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-400 border-2 border-[#0A0D14]"></div>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">{t.timestamp}</span>
                    <span className="text-white font-bold">{t.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">{t.description}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT (5 Cols): LOCATION & VIGIL KNOWLEDGE ASSISTANT */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Assigned Unit & Location */}
          <div className="p-5 rounded-xl border border-white/[0.08] bg-[#0A0D14] space-y-4">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 pb-3 border-b border-white/[0.08]">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              ASSIGNED RESPONDER // #R-104
            </span>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Responder Name:</span>
                <span className="text-white font-bold">Officer Marcus Vance</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Certification:</span>
                <span className="text-emerald-400">Paramedic / Trauma Triage</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Location:</span>
                <span className="text-cyan-400">{incident.location.building} (Floor 2)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">SLA Remaining:</span>
                <span className="text-cyan-400 font-bold">01:24 remaining</span>
              </div>
            </div>
          </div>

          {/* VIGIL Intelligence Grounded Assistant */}
          <div className="p-5 rounded-xl border border-white/[0.08] bg-[#0A0D14] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-cyan-400" />
                VIGIL INTELLIGENCE (GROUNDED RAG)
              </span>
              <span className="text-[10px] font-mono text-slate-500">QDRANT VECTORS</span>
            </div>

            <form onSubmit={handleRagSubmit} className="space-y-2">
              <input
                type="text"
                value={ragQuery}
                onChange={(e) => setRagQuery(e.target.value)}
                placeholder="Ask emergency SOP (e.g. cardiac arrest protocol)..."
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                disabled={ragLoading}
                className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono transition-colors disabled:opacity-50"
              >
                {ragLoading ? 'QUERYING KNOWLEDGE BASE...' : 'QUERY SOP CHECKLIST'}
              </button>
            </form>

            {ragAnswer && (
              <div className="p-3.5 rounded-lg bg-[#080B10] border border-cyan-500/30 text-xs font-mono text-slate-300 space-y-1.5">
                <span className="text-cyan-400 font-bold text-[10px] uppercase block">RECOMMENDED RESPONSE</span>
                <p className="text-[11px] leading-relaxed whitespace-pre-line text-slate-200">{ragAnswer}</p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
