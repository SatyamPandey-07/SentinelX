'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  MapPin, 
  Navigation, 
  Shield, 
  Flame, 
  HeartPulse, 
  AlertTriangle, 
  Layers, 
  Info,
  Radio,
  ChevronRight,
  Compass,
  Crosshair
} from 'lucide-react';
import { MOCK_INCIDENTS, MOCK_RESPONDERS, Incident } from '@/lib/mock-data';

export default function CampusMapPage() {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(MOCK_INCIDENTS[0]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5 font-mono uppercase">
            <span>CAMPUS GEOSPATIAL RADAR</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-400 font-mono border border-slate-700">
              POSTGIS R-TREE
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            HAVERSINE METRIC ENGINE // 150M DUPLICATE RADIUS // GEOFENCED SECTOR ZONES
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
            <span>CRITICAL</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span>RESPONDER READY</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          BENTO GEOSPATIAL LAYOUT
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* BENTO 1: RADAR CANVAS (Col Span 8) */}
        <div className="lg:col-span-8 bento-card relative overflow-hidden h-[540px] flex items-center justify-center p-6 select-none bg-slate-950/90 border border-slate-800">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:28px_28px]"></div>
          
          {/* Radar Circles */}
          <div className="absolute w-[460px] h-[460px] rounded-full border border-cyan-500/10 pointer-events-none"></div>
          <div className="absolute w-[300px] h-[300px] rounded-full border border-cyan-500/15 pointer-events-none"></div>
          <div className="absolute w-[140px] h-[140px] rounded-full border border-cyan-500/20 pointer-events-none"></div>

          {/* Radar Sweep Line */}
          <div className="absolute w-[460px] h-[460px] rounded-full pointer-events-none animate-radar-sweep opacity-30 bg-gradient-to-tr from-cyan-500/20 via-transparent to-transparent"></div>

          {/* Campus Geofenced Sectors */}
          <div className="absolute top-8 left-10 w-72 h-44 rounded-xl border border-cyan-500/30 bg-cyan-950/20 backdrop-blur-[2px] p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-cyan-300">ZONE_NORTH // ENGINEERING</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">SECTOR A</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Chemistry Hall, Computing Labs, Lab 302</div>
          </div>

          <div className="absolute bottom-12 left-12 w-64 h-36 rounded-xl border border-emerald-500/30 bg-emerald-950/20 backdrop-blur-[2px] p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-emerald-300">ZONE_CENTRAL // STUDENT QUAD</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">PUBLIC</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Library, Auditorium, Dining Facility</div>
          </div>

          <div className="absolute bottom-10 right-10 w-72 h-44 rounded-xl border border-purple-500/30 bg-purple-950/20 backdrop-blur-[2px] p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-purple-300">ZONE_SOUTH // MEDICAL CTR</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">RESTRICTED</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Clinic, Trauma Bay, Biohazard Storage</div>
          </div>

          {/* Interactive Incident Pins */}
          {MOCK_INCIDENTS.map((inc, idx) => {
            const positions = [
              { top: '22%', left: '26%' },
              { top: '78%', right: '30%' },
              { top: '55%', left: '38%' },
              { top: '28%', left: '42%' }
            ];
            const pos = positions[idx % positions.length];
            const isSelected = selectedIncident?.id === inc.id;

            return (
              <button
                key={inc.id}
                onClick={() => setSelectedIncident(inc)}
                style={pos}
                className={`absolute z-20 flex flex-col items-center group transition-transform ${
                  isSelected ? 'scale-125' : 'hover:scale-110'
                }`}
              >
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center shadow-lg transition-all ${
                  inc.severity === 'CRITICAL' ? 'bg-red-600/40 border-red-500 text-red-300 pulse-critical' :
                  inc.severity === 'HIGH' ? 'bg-amber-600/40 border-amber-500 text-amber-300' :
                  'bg-cyan-600/40 border-cyan-500 text-cyan-300'
                }`}>
                  <Flame className="w-4 h-4" />
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900/90 text-slate-300 border border-slate-700 font-mono mt-1 font-bold whitespace-nowrap">
                  {inc.id}
                </span>
              </button>
            );
          })}
        </div>

        {/* BENTO 2 & 3: TARGET DOSSIER & TELEMETRY (Col Span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Target Dossier */}
          {selectedIncident ? (
            <div className="bento-card bento-card-critical flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-red-950/60">
                  <span className="text-[11px] font-mono tracking-widest text-red-400 uppercase font-bold flex items-center gap-1.5">
                    <Crosshair className="w-4 h-4 text-red-500" />
                    TARGET SECTOR LOCK
                  </span>
                  <span className="text-[10px] font-mono text-red-400 font-bold">
                    {selectedIncident.id}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-100">{selectedIncident.title}</h3>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-3 font-mono">{selectedIncident.description}</p>
                </div>

                <div className="space-y-1.5 text-xs font-mono pt-2">
                  <div className="flex justify-between text-slate-400">
                    <span>SECTOR:</span>
                    <span className="text-slate-200">{selectedIncident.location.building}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>FLOOR / ZONE:</span>
                    <span className="text-slate-200">{selectedIncident.location.floor} // {selectedIncident.location.zone_id}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>SEVERITY:</span>
                    <span className="text-red-400 font-bold">{selectedIncident.severity}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>ASSIGNED:</span>
                    <span className="text-cyan-400">{selectedIncident.assigned_responder_name || 'AUTO-DISPATCHING'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-red-950/60 mt-3">
                <Link
                  href={`/incidents/${selectedIncident.id}`}
                  className="w-full py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-red-600/30"
                >
                  <span>ENTER TARGET TRIAGE</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="bento-card flex items-center justify-center text-xs font-mono text-slate-500 flex-1">
              Select an incident pin to inspect geospatial telemetry
            </div>
          )}

          {/* PostGIS Telemetry Bento */}
          <div className="bento-card bento-card-info space-y-2">
            <span className="text-[11px] font-mono tracking-widest text-cyan-300 uppercase font-bold flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              POSTGIS SPATIAL TELEMETRY
            </span>
            <p className="text-[11px] text-slate-300 font-mono">
              Haversine nearest-neighbor gRPC queries compute candidate distance in &lt; 8ms.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
