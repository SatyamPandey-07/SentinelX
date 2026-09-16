'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  HeartPulse,
  ShieldAlert,
  Clock,
  CheckCircle2,
  UserCheck,
  Radio,
  Plus,
  Cpu,
  Lock,
  MapPin,
  Activity,
  ArrowRight,
  Send,
  AlertTriangle,
  ChevronRight,
  Shield,
  Crosshair,
  Layers,
  Sparkles
} from 'lucide-react';
import { MOCK_INCIDENTS, MOCK_RESPONDERS, Incident } from '@/lib/mock-data';
import { AnimatedNumber } from '@/components/AnimatedNumber';

const columnReveal = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function DashboardPage() {
  const [incidents, setIncidents] = useState<Incident[]>(MOCK_INCIDENTS);
  const [responders, setResponders] = useState(MOCK_RESPONDERS);
  const [selectedIncident, setSelectedIncident] = useState<Incident>(MOCK_INCIDENTS[0]);
  const [activeTab, setActiveTab] = useState<'MAP' | 'ROSTER'>('MAP');

  const handleAction = (actionType: 'ACKNOWLEDGE' | 'ESCALATE' | 'RESOLVE') => {
    if (!selectedIncident) return;
    let newStatus = selectedIncident.status;
    let newSeverity = selectedIncident.severity;

    if (actionType === 'ACKNOWLEDGE') newStatus = 'ACKNOWLEDGED';
    if (actionType === 'RESOLVE') newStatus = 'RESOLVED';
    if (actionType === 'ESCALATE') newSeverity = 'CRITICAL';

    const updated = {
      ...selectedIncident,
      status: newStatus,
      severity: newSeverity,
      acknowledged_at: actionType === 'ACKNOWLEDGE' ? new Date().toISOString() : selectedIncident.acknowledged_at,
      resolved_at: actionType === 'RESOLVE' ? new Date().toISOString() : selectedIncident.resolved_at
    };

    setSelectedIncident(updated);
    setIncidents(incidents.map(i => i.id === updated.id ? updated : i));
  };

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
            DEFCON 2 // REAL-TIME ACTIVE
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
          <span>ACTIVE: <strong className="text-white"><AnimatedNumber value={12} /></strong></span>
          <span className="text-slate-600">/</span>
          <span>RESPONDERS: <strong className="text-emerald-400"><AnimatedNumber value={148} /></strong></span>
          <span className="text-slate-600">/</span>
          <span>SLA: <strong className="text-cyan-400"><AnimatedNumber value={98.7} decimals={1} suffix="%" /></strong></span>
        </div>
      </div>

      {/* ========================================================
          3-COLUMN ENTERPRISE COMMAND CENTER LAYOUT
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-9.5rem)]">

        {/* ========================================================
            LEFT COLUMN (3 COLS): INCIDENT STREAM LIST
            ======================================================== */}
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
                {incidents.length} STREAMING
              </span>
            </div>

            {/* Scrollable Incident Cards List */}
            <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
              {incidents.map((inc, idx) => {
                const isSelected = selectedIncident?.id === inc.id;
                const isCrit = inc.severity === 'CRITICAL';

                return (
                  <motion.button
                    key={inc.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * idx, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ x: 2 }}
                    onClick={() => setSelectedIncident(inc)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      isSelected
                        ? 'border-cyan-500/80 bg-cyan-950/20 shadow-lg shadow-cyan-500/10'
                        : isCrit
                        ? 'border-red-900/60 bg-red-950/15 hover:border-red-700/80'
                        : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.15]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono font-black text-slate-300">{inc.id}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase ${
                          inc.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                          inc.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        }`}>
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
                        {inc.location.building}
                      </span>
                      <span className="text-amber-400 font-bold">
                        {inc.status}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.08] mt-3 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Event Backbone: Kafka KRaft</span>
            <span className="text-emerald-400">0 lag</span>
          </div>
        </motion.div>

        {/* ========================================================
            CENTER COLUMN (5 COLS): LARGE INTERACTIVE CAMPUS MAP
            ======================================================== */}
        <motion.div
          custom={1}
          variants={columnReveal}
          initial="hidden"
          animate="show"
          className="lg:col-span-5 rounded-xl border border-white/[0.08] bg-[#080A0F] p-4 flex flex-col justify-between relative overflow-hidden select-none">
          
          {/* Map Top Bar */}
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] z-10 text-xs font-mono">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Crosshair className="w-4 h-4 text-cyan-400" />
              CAMPUS TACTICAL RADAR &amp; SECTORS
            </span>
            <div className="flex items-center gap-3 text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span>Incident</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Responder</span>
              </span>
            </div>
          </div>

          {/* Interactive Tactical Canvas Map */}
          <div className="relative flex-1 w-full my-2 flex items-center justify-center overflow-hidden">
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none"></div>

            {/* Radar Scan Circles */}
            <div className="absolute w-[360px] h-[360px] rounded-full border border-cyan-500/10 pointer-events-none"></div>
            <div className="absolute w-[220px] h-[220px] rounded-full border border-cyan-500/15 pointer-events-none"></div>
            <div className="absolute w-[360px] h-[360px] rounded-full pointer-events-none animate-radar-sweep opacity-20 bg-gradient-to-tr from-cyan-500/20 via-transparent to-transparent"></div>

            {/* Geofenced Sector Zones */}
            <div className="absolute top-4 left-6 w-48 h-28 rounded-lg border border-cyan-500/30 bg-cyan-950/20 p-2 flex flex-col justify-between">
              <span className="text-[9px] font-mono text-cyan-400 font-bold">ENGINEERING BLOCK A</span>
              <span className="text-[8px] font-mono text-slate-500">Sector Alpha // Floor 2</span>
            </div>

            <div className="absolute top-6 right-8 w-44 h-24 rounded-lg border border-slate-700/40 bg-slate-900/20 p-2 flex flex-col justify-between">
              <span className="text-[9px] font-mono text-slate-300 font-bold">LABORATORY BLOCK B</span>
              <span className="text-[8px] font-mono text-slate-500">Chemistry Wing</span>
            </div>

            <div className="absolute bottom-6 left-10 w-44 h-24 rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-2 flex flex-col justify-between">
              <span className="text-[9px] font-mono text-emerald-400 font-bold">STUDENT UNION</span>
              <span className="text-[8px] font-mono text-slate-500">Public Quad</span>
            </div>

            <div className="absolute bottom-4 right-6 w-48 h-28 rounded-lg border border-purple-500/30 bg-purple-950/20 p-2 flex flex-col justify-between">
              <span className="text-[9px] font-mono text-purple-400 font-bold">MEDICAL CTR</span>
              <span className="text-[8px] font-mono text-slate-500">Trauma Bay</span>
            </div>

            {/* Connecting Road Routes */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 320">
              <line x1="120" y1="90" x2="380" y2="80" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" strokeDasharray="3 3" />
              <line x1="120" y1="90" x2="140" y2="240" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" strokeDasharray="3 3" />
              <line x1="140" y1="240" x2="400" y2="250" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" strokeDasharray="3 3" />
              
              {/* Active Dispatch Route to Incident */}
              <line x1="130" y1="95" x2="220" y2="140" stroke="#EF4444" strokeWidth="2.5" strokeDasharray="4 2" />
              <circle cx="220" cy="140" r="3" fill="#EF4444" className="animate-ping" />
            </svg>

            {/* Selected Incident Marker */}
            <div className="absolute top-16 left-28 z-20 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-red-600/40 border-2 border-red-500 flex items-center justify-center pulse-critical shadow-lg shadow-red-600/50">
                <Flame className="w-4 h-4 text-red-400" />
              </div>
              <span className="mt-1 px-1.5 py-0.5 rounded bg-red-950/90 border border-red-500/50 text-[8px] font-mono font-bold text-red-300">
                {selectedIncident.id}
              </span>
            </div>

            {/* Responder Markers */}
            <div className="absolute top-32 left-52 z-20 flex flex-col items-center">
              <div className="w-6 h-6 rounded-full bg-emerald-500/30 border border-emerald-400 flex items-center justify-center shadow-md">
                <UserCheck className="w-3.5 h-3.5 text-emerald-300" />
              </div>
              <span className="mt-0.5 text-[8px] font-mono font-bold text-emerald-400 bg-slate-950 px-1 rounded">
                #R-104 (320m)
              </span>
            </div>

            <div className="absolute bottom-16 right-36 z-10 flex flex-col items-center opacity-70">
              <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center">
                <Shield className="w-3 h-3 text-slate-400" />
              </div>
              <span className="text-[7px] font-mono text-slate-500">R-221 (1.2km)</span>
            </div>

            <div className="absolute top-20 right-24 z-10 flex flex-col items-center">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <UserCheck className="w-3 h-3 text-emerald-400" />
              </div>
              <span className="text-[7px] font-mono text-emerald-400">R-119 (740m)</span>
            </div>

          </div>

          <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Location Engine: PostGIS / Haversine gRPC</span>
            <span className="text-cyan-400">Zone North Geofence Locked</span>
          </div>
        </motion.div>

        {/* ========================================================
            RIGHT COLUMN (3 COLS): SELECTED INCIDENT ACTION DOSSIER
            ======================================================== */}
        <motion.div
          custom={2}
          variants={columnReveal}
          initial="hidden"
          animate="show"
          className="lg:col-span-3 rounded-xl border border-white/[0.08] bg-[#0A0D14] p-4 flex flex-col justify-between overflow-y-auto space-y-4">

          <AnimatePresence mode="wait">
          <motion.div
            key={selectedIncident.id}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4">
            {/* Header & Severity */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                  selectedIncident.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                  'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {selectedIncident.severity}
                </span>
                <h2 className="text-sm font-bold text-white mt-1.5">{selectedIncident.category} Emergency</h2>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">{selectedIncident.id}</span>
            </div>

            {/* Telemetry Dossier Parameters */}
            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-slate-400">Location:</span>
                <span className="text-slate-100 font-bold">{selectedIncident.location.building}</span>
              </div>

              <div className="flex justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-slate-400">Reported:</span>
                <span className="text-slate-200">{selectedIncident.created_at}</span>
              </div>

              <div className="flex justify-between p-2 rounded-lg bg-purple-950/20 border border-purple-500/30">
                <span className="text-purple-300">AI Confidence:</span>
                <span className="text-purple-400 font-bold">{selectedIncident.ai_confidence || 97.4}%</span>
              </div>

              <div className="flex justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-slate-400">Assigned:</span>
                <span className="text-cyan-400 font-bold">Responder #R-104</span>
              </div>

              <div className="flex justify-between p-2 rounded-lg bg-cyan-950/20 border border-cyan-500/30">
                <span className="text-cyan-300 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  SLA:
                </span>
                <span className="text-cyan-400 font-bold">01:24 remaining</span>
              </div>

              <div className="flex justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-slate-400">Status:</span>
                <span className="text-emerald-400 font-bold">{selectedIncident.status}</span>
              </div>
            </div>

            {/* AI Reasoning Insight */}
            <div className="p-3 rounded-lg bg-[#0E131E] border border-slate-800 text-[11px] font-mono space-y-1">
              <span className="text-purple-400 font-bold uppercase block flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" />
                AI REASONING
              </span>
              <p className="text-slate-300 leading-relaxed text-[10px]">
                {selectedIncident.ai_reasoning || "High-consequence pattern verified. Deterministic safety override active."}
              </p>
            </div>
          </motion.div>
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="space-y-2 pt-3 border-t border-white/[0.08]">
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleAction('ACKNOWLEDGE')}
                className="py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold font-mono transition-colors"
              >
                ACKNOWLEDGE
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleAction('ESCALATE')}
                className="py-2 px-3 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold font-mono transition-colors"
              >
                ESCALATE
              </motion.button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link
                href={`/incidents/${selectedIncident.id}`}
                className="py-2 px-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-slate-200 text-xs font-mono text-center transition-colors"
              >
                DETAILS
              </Link>
              <button
                onClick={() => handleAction('RESOLVE')}
                className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono transition-colors"
              >
                RESOLVE
              </button>
            </div>
          </div>

        </motion.div>

      </div>
    </div>
  );
}
