'use client';

import React, { useState } from 'react';
import { Send, ShieldCheck, Sparkles, BookOpen, Terminal, AlertTriangle, Loader2 } from 'lucide-react';
import { queryRag, RagQueryResponse, ApiError } from '@/lib/api';

export default function IntelligencePage() {
  const [query, setQuery] = useState('What should responders do for a chemical spill in a lab?');
  const [response, setResponse] = useState<RagQueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      setResponse(await queryRag(query));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Unable to reach ai-service');
    } finally {
      setLoading(false);
    }
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
            LIVE: POST /api/v1/ai/rag/query // QDRANT VECTOR RETRIEVAL // STRICT FACTUAL CITATIONS
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
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>{loading ? 'RETRIEVING...' : 'QUERY SOP'}</span>
          </button>
        </form>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Response Display Box */}
      {response && (
        <div className="p-6 rounded-2xl border border-cyan-500/30 bg-[#080B10] space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              GROUNDED RESPONSE (confidence {(response.confidence * 100).toFixed(0)}%)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              GROUNDED
            </span>
          </div>

          <p className="text-xs font-mono text-slate-200 leading-relaxed whitespace-pre-line">{response.answer}</p>

          <p className="text-[10px] font-mono text-slate-500 italic">{response.disclaimer}</p>

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
                    <span className="text-purple-300 font-bold text-[11px] truncate">{cite.document_name}</span>
                    <span className="text-[10px] text-emerald-400">Score: {cite.relevance_score.toFixed(2)}</span>
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
