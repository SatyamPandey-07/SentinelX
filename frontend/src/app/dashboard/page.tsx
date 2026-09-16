'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  HeartPulse,
  ShieldAlert,
  Clock,
  UserCheck,
  Radio,
  MapPin,
  Shield,
  Crosshair,
  Sparkles,
  Loader2,
  AlertTriangle,
  Zap,
  Skull,
  Wrench,
  Eye,
} from 'lucide-react';
import {
  listIncidents,
  listResponders,
  acknowledgeIncident,
  resolveIncident,
  Incident,
  Responder,
  ApiError,
} from '@/lib/api';
import { getSharedIncidents, updateSharedIncidentStatus } from '@/lib/incident-store';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

const columnReveal = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: EASE_OUT },
  }),
};

const CATEGORY_ICON: Record<string, React.ElementType> = {
  FIRE: Flame,
  MEDICAL: HeartPulse,
  SECURITY: ShieldAlert,
  HAZMAT: Skull,
  INFRASTRUCTURE: Wrench,
  ELECTRICAL: Zap,
  SUSPICIOUS_ACTIVITY: Eye,
  HARASSMENT: ShieldAlert,
  THEFT: ShieldAlert,
  NATURAL_DISASTER: AlertTriangle,
  EQUIPMENT_FAILURE: Wrench,
  OTHER: AlertTriangle,
};

const SEVERITY_BADGE: Record<string, string> = {
  CRITICAL: 'bg-red-500/20 text-red-400 border border-red-500/30',
  HIGH: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  MEDIUM: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
  LOW: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
};

function timeRemaining(deadline: string | null): { label: string; expired: boolean } {
  if (!deadline) return { label: 'NO SLA', expired: false };
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return { label: 'BREACHED', expired: true };
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return { label: `${m}:${String(s).padStart(2, '0')} remaining`, expired: false };
}

export default function DashboardPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [responders, setResponders] = useState<Responder[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [, forceTick] = useState(0);

  const load = useCallback(async () => {
    try {
      const [incidentPage, responderList] = await Promise.all([
        listIncidents({ size: 20 }),
        listResponders().catch(() => [] as Responder[]),
      ]);
      const shared = getSharedIncidents();
      const combined = [...shared, ...incidentPage.content.filter((p) => !shared.some((s) => s.id === p.id))];
      setIncidents(combined as any);
      setResponders(responderList);
      setError(null);
      setSelectedId((prev) => prev ?? combined[0]?.id ?? null);
    } catch {
      // Fallback to shared incidents store (includes user-reported incidents)
      const shared = getSharedIncidents();
      setIncidents(shared as any);
      setSelectedId((prev) => prev ?? shared[0]?.id ?? null);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const poll = setInterval(load, 8000);
    const clock = setInterval(() => forceTick((t) => t + 1), 1000);

    const onIncidentsUpdated = () => {
      const shared = getSharedIncidents();
      setIncidents(shared as any);
    };
    window.addEventListener('sentinelx_incidents_updated', onIncidentsUpdated);

    return () => {
      clearInterval(poll);
      clearInterval(clock);
      window.removeEventListener('sentinelx_incidents_updated', onIncidentsUpdated);
    };
  }, [load]);

  const selectedIncident = incidents.find((i) => i.id === selectedId) ?? null;

  const handleAction = async (action: 'ACKNOWLEDGE' | 'RESOLVE') => {
    if (!selectedIncident || actionPending) return;
    setActionPending(true);
    const newStatus = action === 'ACKNOWLEDGE' ? 'ACKNOWLEDGED' : 'RESOLVED';
    try {
      if (action === 'ACKNOWLEDGE') {
        await acknowledgeIncident(selectedIncident.id);
      } else {
        await resolveIncident(selectedIncident.id);
      }
    } catch {
      // Offline fallback handling
    }
    updateSharedIncidentStatus(selectedIncident.id, newStatus);
    setIncidents((prev) => prev.map((i) => (i.id === selectedIncident.id ? { ...i, status: newStatus } : i)));
    setActionPending(false);
  };

  const respondersById = new Map(responders.map((r) => [r.id, r]));
  const activeCount = incidents.filter((i) => !['RESOLVED', 'CLOSED', 'CANCELLED'].includes(i.status)).length;
  const availableResponders = responders.filter((r) => r.status === 'AVAILABLE').length;
  const slaHealthy = incidents.length
    ? incidents.filter((i) => !timeRemaining(i.sla_ack_deadline).expired).length / incidents.length * 100
    : 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-9.5rem)] text-slate-400 font-mono text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        CONNECTING TO INCIDENT-SERVICE...
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Top Telemetry Ticker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
            <h1 className="text-base font-black tracking-widest text-white uppercase font-mono">
              VIGIL // INCIDENT COMMAND CENTER
            </h1>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-slate-400 font-mono">
            LIVE // incident-service + location-service
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
          <span>ACTIVE: <strong className="text-white">{activeCount}</strong></span>
          <span className="text-slate-600">/</span>
          <span>RESPONDERS AVAILABLE: <strong className="text-emerald-400">{availableResponders}/{responders.length}</strong></span>
          <span className="text-slate-600">/</span>
          <span>SLA HEALTHY: <strong className="text-cyan-400">{slaHealthy.toFixed(0)}%</strong></span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {incidents.length === 0 ? (
        <div className="rounded-xl border border-white/[0.08] bg-[#0A0D14] p-12 text-center">
          <Radio className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-mono text-sm">No incidents reported yet.</p>
          <Link href="/incidents" className="inline-block mt-3 text-cyan-400 font-mono text-xs hover:underline">
            Report the first incident →
          </Link>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-9.5rem)]">

        {/* LEFT: INCIDENT STREAM LIST */}
        <motion.div
          custom={0}
          variants={columnReveal}
          initial="hidden"
          animate="show"
          className="lg:col-span-4 rounded-xl border border-white/[0.08] bg-[#0A0D14] p-4 flex flex-col justify-between overflow-hidden">
          <div className="space-y-3 flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                ACTIVE INCIDENT QUEUE
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {incidents.length} LOADED
              </span>
            </div>

            <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
              {incidents.map((inc, idx) => {
                const isSelected = selectedId === inc.id;
                const isCrit = inc.severity === 'CRITICAL';

                return (
                  <motion.button
                    key={inc.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.03 * idx, duration: 0.3, ease: EASE_OUT }}
                    whileHover={{ x: 2 }}
                    onClick={() => setSelectedId(inc.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      isSelected
                        ? 'border-cyan-500/80 bg-cyan-950/20 shadow-lg shadow-cyan-500/10'
                        : isCrit
                        ? 'border-red-900/60 bg-red-950/15 hover:border-red-700/80'
                        : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.15]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono font-black text-slate-300">{inc.id.slice(0, 8)}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase ${SEVERITY_BADGE[inc.severity] ?? SEVERITY_BADGE.MEDIUM}`}>
                          {inc.severity}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 font-mono">
                          {inc.category}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-xs font-bold text-slate-100 mt-1.5 truncate">{inc.title}</h3>

                    <div className="mt-2 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span className="text-slate-300 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-cyan-400" />
                        {inc.location.building || inc.location.zone_id || 'Unlocated'}
                      </span>
                      <span className="text-amber-400 font-bold">
                        {inc.status}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.08] mt-3 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Source: PostgreSQL via incident-service</span>
            <span className="text-emerald-400">polling 8s</span>
          </div>
        </motion.div>

        {/* CENTER: SPOTLIGHT / TACTICAL RADAR */}
        <motion.div
          custom={1}
          variants={columnReveal}
          initial="hidden"
          animate="show"
          className="lg:col-span-5 rounded-xl border border-white/[0.08] bg-[#080A0F] p-4 flex flex-col justify-between relative overflow-hidden select-none">

          <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] z-10 text-xs font-mono">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Crosshair className="w-4 h-4 text-cyan-400" />
              TARGET SPOTLIGHT
            </span>
            <Link href="/map" className="text-cyan-400 hover:underline">Full Campus Map →</Link>
          </div>

          <div className="relative flex-1 w-full my-2 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none"></div>
            <div className="absolute w-[360px] h-[360px] rounded-full border border-cyan-500/10 pointer-events-none"></div>
            <div className="absolute w-[220px] h-[220px] rounded-full border border-cyan-500/15 pointer-events-none"></div>
            <div className="absolute w-[360px] h-[360px] rounded-full pointer-events-none animate-radar-sweep opacity-20 bg-gradient-to-tr from-cyan-500/20 via-transparent to-transparent"></div>

            <AnimatePresence mode="wait">
              {selectedIncident && (
                <motion.div
                  key={selectedIncident.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="z-20 flex flex-col items-center"
                >
                  {(() => {
                    const Icon = CATEGORY_ICON[selectedIncident.category] ?? AlertTriangle;
                    const isCrit = selectedIncident.severity === 'CRITICAL';
                    return (
                      <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center shadow-lg ${
                        isCrit ? 'bg-red-600/40 border-red-500 pulse-critical shadow-red-600/50' : 'bg-amber-600/30 border-amber-500 shadow-amber-600/40'
                      }`}>
                        <Icon className={`w-7 h-7 ${isCrit ? 'text-red-300' : 'text-amber-300'}`} />
                      </div>
                    );
                  })()}
                  <span className="mt-2 px-2 py-1 rounded bg-slate-950/90 border border-white/10 text-[10px] font-mono font-bold text-slate-200">
                    {selectedIncident.location.building || selectedIncident.location.zone_id || 'Location pending'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Nearby responders orbiting the target, positioned illustratively */}
            {responders.slice(0, 4).map((r, i) => {
              const angle = (i / Math.max(responders.length, 1)) * 2 * Math.PI;
              const radius = 150;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              const isAvailable = r.status === 'AVAILABLE';
              return (
                <div
                  key={r.id}
                  className="absolute z-10 flex flex-col items-center transition-transform"
                  style={{ transform: `translate(${x}px, ${y}px)` }}
                >
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                    isAvailable ? 'bg-emerald-500/30 border-emerald-400' : 'bg-slate-800 border-slate-600'
                  }`}>
                    {isAvailable ? <UserCheck className="w-3.5 h-3.5 text-emerald-300" /> : <Shield className="w-3 h-3 text-slate-400" />}
                  </div>
                  <span className="text-[7px] font-mono text-slate-400 bg-slate-950/80 px-1 rounded mt-0.5">{r.name.split(' ')[0]}</span>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Location Engine: PostGIS / location-service</span>
            <span className="text-cyan-400">{responders.length} responders tracked</span>
          </div>
        </motion.div>

        {/* RIGHT: SELECTED INCIDENT ACTION DOSSIER */}
        <motion.div
          custom={2}
          variants={columnReveal}
          initial="hidden"
          animate="show"
          className="lg:col-span-3 rounded-xl border border-white/[0.08] bg-[#0A0D14] p-4 flex flex-col justify-between overflow-y-auto space-y-4">

          {selectedIncident ? (
          <>
          <AnimatePresence mode="wait">
          <motion.div
            key={selectedIncident.id}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.22, ease: EASE_OUT }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${SEVERITY_BADGE[selectedIncident.severity] ?? SEVERITY_BADGE.MEDIUM}`}>
                  {selectedIncident.severity}
                </span>
                <h2 className="text-sm font-bold text-white mt-1.5">{selectedIncident.category} Emergency</h2>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">{selectedIncident.id.slice(0, 8)}</span>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-slate-400">Location:</span>
                <span className="text-slate-100 font-bold">{selectedIncident.location.building || selectedIncident.location.zone_id || '—'}</span>
              </div>

              <div className="flex justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-slate-400">Reported:</span>
                <span className="text-slate-200">{new Date(selectedIncident.created_at).toLocaleTimeString()}</span>
              </div>

              <div className="flex justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-slate-400">Assigned:</span>
                <span className="text-cyan-400 font-bold">
                  {selectedIncident.assigned_responder_id
                    ? (respondersById.get(selectedIncident.assigned_responder_id)?.name ?? selectedIncident.assigned_responder_id)
                    : 'Unassigned'}
                </span>
              </div>

              {(() => {
                const sla = timeRemaining(selectedIncident.sla_ack_deadline);
                return (
                  <div className={`flex justify-between p-2 rounded-lg border ${sla.expired ? 'bg-red-950/30 border-red-500/30' : 'bg-cyan-950/20 border-cyan-500/30'}`}>
                    <span className={sla.expired ? 'text-red-300 flex items-center gap-1' : 'text-cyan-300 flex items-center gap-1'}>
                      <Clock className="w-3 h-3" />
                      SLA (ack):
                    </span>
                    <span className={`font-bold ${sla.expired ? 'text-red-400' : 'text-cyan-400'}`}>{sla.label}</span>
                  </div>
                );
              })()}

              <div className="flex justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-slate-400">Status:</span>
                <span className="text-emerald-400 font-bold">{selectedIncident.status}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#0E131E] border border-slate-800 text-[11px] font-mono space-y-1">
              <span className="text-purple-400 font-bold uppercase block flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" />
                REPORT
              </span>
              <p className="text-slate-300 leading-relaxed text-[10px]">
                {selectedIncident.description}
              </p>
            </div>
          </motion.div>
          </AnimatePresence>

          <div className="space-y-2 pt-3 border-t border-white/[0.08]">
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                disabled={actionPending || selectedIncident.status === 'ACKNOWLEDGED' || selectedIncident.status === 'RESOLVED'}
                onClick={() => handleAction('ACKNOWLEDGE')}
                className="py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-bold font-mono transition-colors"
              >
                ACKNOWLEDGE
              </motion.button>
              <Link
                href={`/incidents/${selectedIncident.id}`}
                className="py-2 px-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-slate-200 text-xs font-mono text-center transition-colors flex items-center justify-center"
              >
                DETAILS
              </Link>
            </div>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              disabled={actionPending || selectedIncident.status === 'RESOLVED'}
              onClick={() => handleAction('RESOLVE')}
              className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold font-mono transition-colors"
            >
              {actionPending ? 'SUBMITTING...' : 'RESOLVE'}
            </motion.button>
          </div>
          </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 font-mono text-xs">Select an incident</div>
          )}

        </motion.div>

      </div>
      )}
    </div>
  );
}
