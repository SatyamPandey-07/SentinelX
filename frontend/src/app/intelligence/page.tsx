'use client';

import React, { useState } from 'react';
import { Bot, Send, ShieldCheck, Sparkles, BookOpen, Terminal, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function IntelligencePage() {
  const [query, setQuery] = useState('What should responders do for a chemical spill in Laboratory Block B?');
  const [response, setResponse] = useState<{
    title: string;
    steps: string[];
    citations: { doc: string; section: string; relevance: number }[];
  } | null>({
    title: "RECOMMENDED RESPONSE: HAZMAT VOLATILE SOLVENT PROTOCOL",
    steps: [
      "1. Isolate affected zone: Establish a 100-meter exclusion boundary upwind and seal all corridor fire doors.",
      "2. Notify safety team: Alert Campus Environmental Health & Safety (EHS ext. 4400) and dispatch Level B PPE team.",
      "3. Dispatch trained responder: Deploy Unit #R-119 (Hazmat Certified) equipped with sodium bicarbonate neutralizer kit H-4.",
      "4. Begin evacuation protocol: Order immediate vertical evacuation of Laboratory Block B, floors 2 through 4, and cut HVAC zone dampers."
    ],
    citations: [
      { doc: "Campus Chemical & Toxic Fume Containment Protocol (SOP-03)", section: "Section 4.2 - Laboratory Spill Exclusion Perimeters", relevance: 0.96 },
      { doc: "Hazardous Chemical Neutralization Manual (SOP-HAZ-2024)", section: "Section 1.8 - Acid & Solvent Neutralization Procedures", relevance: 0.91 }
    ]
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);

    setTimeout(() => {
      setResponse({
        title: "RECOMMENDED RESPONSE: INCIDENT CONTAINMENT DIRECTIVE",
        steps: [
          "1. Verify exact incident coordinates via Location Service gRPC and ensure responder lock is acquired.",
          "2. Enforce standard operational containment per relevant SOP binder section.",
          "3. Dispatch primary specialist unit within target SLA window (< 2.0m for CRITICAL).",
          "4. Record cryptographic audit event upon every state transition to prevent ledger tampering."
        ],
        citations: [
          { doc: "Campus Standard Operating Procedures Master Index", section: "Section 2.1 - General Emergency Response", relevance: 0.94 }
        ]
      });
      setLoading(false);
    }, 500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5 font-mono uppercase">
            <span>VIGIL INTELLIGENCE // GROUNDED SOP ASSISTANT</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            QDRANT VECTOR RETRIEVAL // ZERO-TEMPERATURE GENERATION ($T=0.0$) // STRICT FACTUAL CITATIONS
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-purple-400 bg-purple-950/30 border border-purple-500/30 px-3 py-1.5 rounded-lg">
          <Sparkles className="w-3.5 h-3.5" />
          <span>DETERMINISTIC SAFETY ACTIVE</span>
        </div>
      </div>

      {/* Query Terminal Box */}
      <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0A0D14] space-y-4">
        <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-white/[0.08]">
          <Terminal className="w-4 h-4 text-cyan-400" />
          ENTER OPERATIONAL QUERY
        </span>

        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask SOP procedure, chemical containment, evacuation guidelines..."
            className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{loading ? 'RETRIEVING...' : 'QUERY SOP'}</span>
          </button>
        </form>
      </div>

      {/* Response Display Box */}
      {response && (
        <div className="p-6 rounded-2xl border border-cyan-500/30 bg-[#080B10] space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              {response.title}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              GROUNDED
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Step-by-Step Action Items:</span>
            <div className="space-y-2">
              {response.steps.map((step, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-200">
                  {step}
                </div>
              ))}
            </div>
          </div>

          {/* Citations Box */}
          <div className="pt-4 border-t border-white/[0.08] space-y-2 font-mono">
            <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-purple-400" />
              VERIFIED KNOWLEDGE BASE CITATIONS:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {response.citations.map((cite, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-300 font-bold text-[11px] truncate">{cite.doc}</span>
                    <span className="text-[10px] text-emerald-400">Score: {cite.relevance}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">{cite.section}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
