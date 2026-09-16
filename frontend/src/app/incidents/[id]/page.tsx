'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  MapPin,
  UserCheck,
  Bot,
  Loader2,
  Sparkles,
  ScrollText,
  AlertTriangle,
} from 'lucide-react';
import {
  getIncident,
  listResponders,
  listAuditEvents,
  acknowledgeIncident,
  resolveIncident,
  queryRag,
  Incident,
  Responder,
  AuditEvent,
  RagQueryResponse,
  ApiError,
} from '@/lib/api';

function timeRemaining(deadline: string | null): { label: string; expired: boolean } {
  if (!deadline) return { label: 'NO SLA SET', expired: false };
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return { label: 'BREACHED', expired: true };
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return { label: `${m}:${String(s).padStart(2, '0')} remaining`, expired: false };
}

export default function IncidentDetailPage({ params }: { params: { id: string } }) {
  const incidentId = params.id;
  const [incident, setIncident] = useState<Incident | null>(null);
  const [responder, setResponder] = useState<Responder | null>(null);
  const [auditTrail, setAuditTrail] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [, forceTick] = useState(0);

  const load = useCallback(async () => {
    try {
      const inc = await getIncident(incidentId);
      setIncident(inc);
      setError(null);

      if (inc.assigned_responder_id) {
        listResponders()
          .then((list) => setResponder(list.find((r) => r.id === inc.assigned_responder_id) ?? null))
          .catch(() => {});
      }

      // audit-service has no per-resource filter endpoint -- pull a recent
      // page and filter client-side by resourceId for this incident's
      // real hash-chained trail.
      listAuditEvents({ size: 100 })
        .then((page) => setAuditTrail(page.content.filter((e) => e.resourceId === incidentId)))
        .catch(() => {});
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Unable to reach incident-service');
    } finally {
      setLoading(false);
    }
  }, [incidentId]);

  useEffect(() => {
    load();
    const poll = setInterval(load, 6000);
    const clock = setInterval(() => forceTick((t) => t + 1), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(clock);
    };
  }, [load]);

  const handleAcknowledge = async () => {
    setActionPending(true);
    try {
      setIncident(await acknowledgeIncident(incidentId));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to acknowledge');
    } finally {
      setActionPending(false);
    }
  };

  const handleResolve = async () => {
    setActionPending(true);
    try {
      setIncident(await resolveIncident(incidentId));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to resolve');
    } finally {
      setActionPending(false);
    }
  };

  // RAG query state
  const [ragQuery, setRagQuery] = useState('');
  const [ragAnswer, setRagAnswer] = useState<RagQueryResponse | null>(null);
  const [ragLoading, setRagLoading] = useState(false);
  const [ragError, setRagError] = useState<string | null>(null);

  const handleRagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ragQuery.trim()) return;
    setRagLoading(true);
    setRagError(null);
    try {
      setRagAnswer(await queryRag(ragQuery, incident?.category));
    } catch (e) {
      setRagError(e instanceof ApiError ? e.message : 'RAG query failed');
    } finally {
      setRagLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400 font-mono text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        LOADING INCIDENT {incidentId.slice(0, 8)}...
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
        <p className="text-slate-300 font-mono">{error || 'Incident not found'}</p>
        <Link href="/incidents" className="text-cyan-400 font-mono text-sm hover:underline">← Back to Incidents</Link>
      </div>
    );
  }

  const sla = timeRemaining(incident.sla_ack_deadline);
  const isCritical = incident.severity === 'CRITICAL';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <Link
            href="/incidents"
            className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                isCritical ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}>
                {incident.severity} {incident.category}
              </span>
              <span className="text-base font-black font-mono text-white">{incident.id.slice(0, 8)}</span>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {incident.status}
              </span>
            </div>
            <h1 className="text-xl font-bold text-white mt-1">{incident.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {incident.status !== 'RESOLVED' && incident.status !== 'CLOSED' && (
            <>
              {incident.status !== 'ACKNOWLEDGED' && (
                <button
                  onClick={handleAcknowledge}
                  disabled={actionPending}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 text-xs font-bold font-mono transition-colors"
                >
                  ACKNOWLEDGE
                </button>
              )}
              <button
                onClick={handleResolve}
                disabled={actionPending}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold font-mono transition-colors"
              >
                RESOLVE INCIDENT
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT (7 Cols): REPORT & AUDIT TRAIL */}
        <div className="lg:col-span-7 space-y-6">

          <div className="p-5 rounded-xl border border-white/[0.08] bg-[#0A0D14] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                INCIDENT REPORT
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-slate-500 text-[10px] block">CATEGORY</span>
                <span className="text-white font-bold">{incident.category}</span>
              </div>
              <div className="p-3 rounded-lg bg-red-950/20 border border-red-500/30">
                <span className="text-red-400 text-[10px] block">SEVERITY</span>
                <span className="text-red-400 font-bold">{incident.severity}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#080B10] border border-slate-800 text-[11px] font-mono space-y-1">
              <span className="text-slate-400 font-bold uppercase block text-[10px]">REPORTER DESCRIPTION:</span>
              <p className="text-slate-300 leading-relaxed text-[11px] whitespace-pre-line">{incident.description}</p>
            </div>
          </div>

          {/* Real Audit Trail (hash-chained, filtered by resourceId) */}
          <div className="p-5 rounded-xl border border-white/[0.08] bg-[#0A0D14] space-y-4">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 pb-3 border-b border-white/[0.08]">
              <ScrollText className="w-4 h-4 text-cyan-400" />
              CRYPTOGRAPHIC AUDIT TRAIL // audit-service
            </span>

            {auditTrail.length === 0 ? (
              <p className="text-slate-500 font-mono text-xs">No audit events recorded yet for this incident.</p>
            ) : (
              <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/[0.08] pl-6">
                {auditTrail.map((e) => (
                  <div key={e.id} className="relative space-y-1 text-xs font-mono">
                    <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-400 border-2 border-[#0A0D14]"></div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-cyan-400 font-bold">{new Date(e.occurredAt).toLocaleTimeString()}</span>
                      <span className="text-white font-bold">{e.action}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">by {e.principalId} ({e.principalRole})</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT (5 Cols): RESPONDER, SLA & RAG ASSISTANT */}
        <div className="lg:col-span-5 space-y-6">

          <div className="p-5 rounded-xl border border-white/[0.08] bg-[#0A0D14] space-y-4">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 pb-3 border-b border-white/[0.08]">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              ASSIGNMENT &amp; SLA
            </span>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Responder:</span>
                <span className="text-white font-bold">{responder?.name ?? incident.assigned_responder_id ?? 'Unassigned'}</span>
              </div>
              {responder && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Skills:</span>
                  <span className="text-emerald-400">{responder.skills}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Location:</span>
                <span className="text-cyan-400">{incident.location.building || incident.location.zone_id || '—'} {incident.location.floor && `(${incident.location.floor})`}</span>
              </div>
              <div className={`flex justify-between p-2 -mx-2 rounded-lg ${sla.expired ? 'bg-red-950/30' : ''}`}>
                <span className={sla.expired ? 'text-red-300 flex items-center gap-1' : 'text-slate-400 flex items-center gap-1'}>
                  <Clock className="w-3 h-3" /> SLA (ack):
                </span>
                <span className={`font-bold ${sla.expired ? 'text-red-400' : 'text-cyan-400'}`}>{sla.label}</span>
              </div>
            </div>
          </div>

          {/* Real, grounded RAG assistant */}
          <div className="p-5 rounded-xl border border-white/[0.08] bg-[#0A0D14] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-cyan-400" />
                VIGIL INTELLIGENCE (GROUNDED RAG)
              </span>
              <span className="text-[10px] font-mono text-slate-500">QDRANT + ai-service</span>
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
                className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {ragLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {ragLoading ? 'QUERYING KNOWLEDGE BASE...' : 'QUERY SOP CHECKLIST'}
              </button>
            </form>

            {ragError && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-mono">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {ragError}
              </div>
            )}

            {ragAnswer && (
              <div className="p-3.5 rounded-lg bg-[#080B10] border border-cyan-500/30 text-xs font-mono text-slate-300 space-y-2">
                <span className="text-cyan-400 font-bold text-[10px] uppercase block">RECOMMENDED RESPONSE (confidence {(ragAnswer.confidence * 100).toFixed(0)}%)</span>
                <p className="text-[11px] leading-relaxed whitespace-pre-line text-slate-200">{ragAnswer.answer}</p>
                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[9px] uppercase">Sources</span>
                  {ragAnswer.citations.map((c, i) => (
                    <div key={i} className="text-[10px] text-slate-400">
                      {c.document_name} — {c.section} <span className="text-slate-600">({(c.relevance_score * 100).toFixed(0)}% relevant)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
