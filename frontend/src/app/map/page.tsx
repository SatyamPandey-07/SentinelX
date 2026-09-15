'use client';

import React, { useState } from 'react';
import { MapPin, Navigation, Shield, Flame, HeartPulse, AlertTriangle, Layers, Info } from 'lucide-react';
import { MOCK_INCIDENTS, MOCK_RESPONDERS, Incident } from '@/lib/mock-data';

export default function CampusMapPage() {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(MOCK_INCIDENTS[0]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <span>CAMPUS GEOSPATIAL MAP &amp; ZONES</span>
            <span className="text-xs px-2 py-0.5 rounded bg-surface-elevated text-slate-400 font-mono">
              POSTGIS SPATIAL ENGINE
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            REAL-TIME INCIDENT PINS // HAVERSINE DISTANCE COMPUTATION // GEOFENCED ZONES
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span>CRITICAL INCIDENT</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span>AVAILABLE RESPONDER</span>
          </div>
        </div>
      </div>

      {/* Map Layout: Tactical Canvas + Side Details */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-14rem)]">
        {/* Canvas Left 3 Cols */}
        <div className="lg:col-span-3 rounded-xl bg-slate-950 border border-border relative overflow-hidden flex items-center justify-center p-6 select-none">
          {/* Grid Background */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]"></div>
          
          {/* Radar Sweep Effect */}
          <div className="absolute w-[500px] h-[500px] rounded-full border border-blue-500/15 pointer-events-none"></div>
          <div className="absolute w-[300px] h-[300px] rounded-full border border-blue-500/15 pointer-events-none"></div>

          {/* Campus Zones Visual Representations */}
          {/* Zone 1: North Engineering Quad */}
          <div className="absolute top-12 left-16 w-80 h-52 rounded-xl border border-blue-500/30 bg-blue-900/10 backdrop-blur-[2px] p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-blue-400">ZONE_NORTH // ENGINEERING QUAD</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">UNRESTRICTED</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Science &amp; Chemistry Hall, Computing Labs</div>
          </div>

          {/* Zone 2: Central Student Union */}
          <div className="absolute top-72 left-44 w-72 h-44 rounded-xl border border-emerald-500/30 bg-emerald-900/10 backdrop-blur-[2px] p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-emerald-400">ZONE_CENTRAL // STUDENT UNION</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">PUBLIC</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Central Library, Dining Hall, Auditorium</div>
          </div>

          {/* Zone 3: South Medical Center */}
          <div className="absolute bottom-10 right-20 w-80 h-52 rounded-xl border border-purple-500/30 bg-purple-900/10 backdrop-blur-[2px] p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-purple-400">ZONE_SOUTH // MEDICAL CENTER</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">RESTRICTED</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Infirmary, Bio-Labs, Athletics Gym</div>
          </div>

          {/* Interactive Incident Pins */}
          {MOCK_INCIDENTS.map((inc, idx) => {
            // Relative positions for visualization
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
                  inc.severity === 'CRITICAL' ? 'bg-red-600/30 border-red-500 text-red-400 pulse-critical' :
                  inc.severity === 'HIGH' ? 'bg-amber-600/30 border-amber-500 text-amber-400' :
                  'bg-blue-600/30 border-blue-500 text-blue-400'
                }`}>
                  <Flame className="w-4 h-4" />
                </div>
                <span className="mt-1 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-slate-200 border border-border whitespace-nowrap">
                  {inc.id}
                </span>
              </button>
            );
          })}

          {/* Responder Units Pins */}
          {MOCK_RESPONDERS.map((resp, idx) => {
            const respPositions = [
              { top: '18%', left: '32%' },
              { bottom: '22%', right: '24%' },
              { top: '65%', left: '48%' },
              { top: '35%', left: '40%' }
            ];
            const pos = respPositions[idx % respPositions.length];

            return (
              <div
                key={resp.id}
                style={pos}
                className="absolute z-10 flex flex-col items-center pointer-events-none"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 shadow-sm">
                  <Navigation className="w-3 h-3" />
                </div>
                <span className="mt-0.5 px-1.5 py-0.2 rounded bg-black/70 text-[9px] font-mono text-emerald-300">
                  {resp.name.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right 1 Col: Selected Incident / Zone Info */}
        <div className="rounded-xl bg-surface border border-border p-5 flex flex-col justify-between space-y-4 overflow-y-auto">
          {selectedIncident ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="text-xs font-mono font-bold text-slate-400">SELECTED PIN</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                  selectedIncident.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                  'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                }`}>
                  {selectedIncident.severity}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-mono text-hud-cyan">{selectedIncident.id}</span>
                <h3 className="text-sm font-bold text-slate-100">{selectedIncident.title}</h3>
                <p className="text-xs text-slate-400 pt-1 leading-relaxed">{selectedIncident.description}</p>
              </div>

              <div className="p-3 rounded-lg bg-surface-elevated border border-border space-y-2 text-xs font-mono">
                <div className="text-slate-400 text-[10px]">GEOLOCATION DATA</div>
                <div className="text-slate-200">{selectedIncident.location.building}</div>
                <div className="text-slate-400 text-[11px]">{selectedIncident.location.floor} // {selectedIncident.location.address}</div>
                <div className="text-hud-cyan text-[11px] pt-1">
                  LAT/LON: {selectedIncident.location.latitude.toFixed(4)}, {selectedIncident.location.longitude.toFixed(4)}
                </div>
              </div>

              {selectedIncident.assigned_responder_name && (
                <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-500/30 text-xs font-mono space-y-1">
                  <div className="text-blue-300 font-semibold text-[11px]">DISPATCHED UNIT</div>
                  <div className="text-slate-200">{selectedIncident.assigned_responder_name}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs font-mono text-slate-400 text-center my-auto">
              Select a pin on the map to inspect telemetry
            </div>
          )}

          <div className="pt-3 border-t border-border text-[11px] font-mono text-slate-500">
            HAVERSINE METRIC: 6,371,000m EARTH RADIUS
          </div>
        </div>
      </div>
    </div>
  );
}
