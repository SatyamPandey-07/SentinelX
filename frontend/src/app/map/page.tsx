'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Flame, ChevronRight, Compass, Crosshair, Loader2, AlertTriangle, UserCheck } from 'lucide-react';
import { listIncidents, listResponders, listZones, Incident, Responder, CampusZone, ApiError } from '@/lib/api';

export default function CampusMapPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [responders, setResponders] = useState<Responder[]>([]);
  const [zones, setZones] = useState<CampusZone[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [incPage, respList, zoneList] = await Promise.all([
        listIncidents({ size: 100 }),
        listResponders().catch(() => [] as Responder[]),
        listZones().catch(() => [] as CampusZone[]),
      ]);
      setIncidents(incPage.content);
      setResponders(respList);
      setZones(zoneList);
      setError(null);
      setSelectedId((prev) => prev ?? incPage.content[0]?.id ?? null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Unable to reach incident-service');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const poll = setInterval(load, 10000);
    return () => clearInterval(poll);
  }, [load]);

  const selectedIncident = incidents.find((i) => i.id === selectedId) ?? null;

  // Real lat/lon -> panel-relative percentage projection, bounded by
  // whatever points actually exist (incidents + responders + zone
  // corners) rather than a fixed decorative layout.
  const bounds = useMemo(() => {
    const lats = [
      ...incidents.map((i) => i.location.latitude),
      ...responders.map((r) => r.latitude),
      ...zones.flatMap((z) => [z.minLat, z.maxLat]),
    ];
    const lons = [
      ...incidents.map((i) => i.location.longitude),
      ...responders.map((r) => r.longitude),
      ...zones.flatMap((z) => [z.minLon, z.maxLon]),
    ];
    if (lats.length === 0) return { minLat: 37.77, maxLat: 37.78, minLon: -122.43, maxLon: -122.41 };
    const pad = 0.001;
    return {
      minLat: Math.min(...lats) - pad,
      maxLat: Math.max(...lats) + pad,
      minLon: Math.min(...lons) - pad,
      maxLon: Math.max(...lons) + pad,
    };
  }, [incidents, responders, zones]);

  const project = (lat: number, lon: number) => {
    const latSpan = bounds.maxLat - bounds.minLat || 1;
    const lonSpan = bounds.maxLon - bounds.minLon || 1;
    const top = 100 - ((lat - bounds.minLat) / latSpan) * 100; // higher lat = further "north" = smaller top%
    const left = ((lon - bounds.minLon) / lonSpan) * 100;
    return { top: `${Math.min(95, Math.max(5, top))}%`, left: `${Math.min(95, Math.max(5, left))}%` };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5 font-mono uppercase">
            <span>CAMPUS GEOSPATIAL RADAR</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-400 font-mono border border-slate-700">
              LIVE
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            REAL COORDINATES FROM incident-service + location-service, projected to panel space
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
            <span>CRITICAL</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span>RESPONDER</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-400 font-mono text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          LOADING GEOSPATIAL DATA...
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* RADAR CANVAS */}
        <div className="lg:col-span-8 bento-card relative overflow-hidden h-[540px] flex items-center justify-center p-6 select-none bg-slate-950/90 border border-slate-800">
          <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:28px_28px]"></div>
          <div className="absolute w-[460px] h-[460px] rounded-full border border-cyan-500/10 pointer-events-none"></div>
          <div className="absolute w-[300px] h-[300px] rounded-full border border-cyan-500/15 pointer-events-none"></div>
          <div className="absolute w-[140px] h-[140px] rounded-full border border-cyan-500/20 pointer-events-none"></div>
          <div className="absolute w-[460px] h-[460px] rounded-full pointer-events-none animate-radar-sweep opacity-30 bg-gradient-to-tr from-cyan-500/20 via-transparent to-transparent"></div>

          {/* Real campus zones, positioned from their real min/max lat/lon */}
          {zones.map((z) => {
            const topLeft = project(z.maxLat, z.minLon);
            const bottomRight = project(z.minLat, z.maxLon);
            return (
              <div
                key={z.id}
                className={`absolute rounded-xl border backdrop-blur-[2px] p-2 pointer-events-none ${
                  z.restricted ? 'border-purple-500/30 bg-purple-950/20' : 'border-emerald-500/30 bg-emerald-950/20'
                }`}
                style={{
                  top: topLeft.top,
                  left: topLeft.left,
                  width: `calc(${bottomRight.left} - ${topLeft.left})`,
                  height: `calc(${bottomRight.top} - ${topLeft.top})`,
                  minWidth: '80px',
                  minHeight: '40px',
                }}
              >
                <span className={`text-[9px] font-mono font-bold ${z.restricted ? 'text-purple-300' : 'text-emerald-300'}`}>
                  {z.name}
                </span>
              </div>
            );
          })}

          {/* Responder markers */}
          {responders.map((r) => {
            const pos = project(r.latitude, r.longitude);
            return (
              <div key={r.id} className="absolute z-10 flex flex-col items-center" style={pos}>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  r.status === 'AVAILABLE' ? 'bg-emerald-500/30 border-emerald-400' : 'bg-slate-800 border-slate-600'
                }`}>
                  <UserCheck className="w-3 h-3 text-emerald-300" />
                </div>
              </div>
            );
          })}

          {/* Interactive Incident Pins */}
          {incidents.map((inc) => {
            const pos = project(inc.location.latitude, inc.location.longitude);
            const isSelected = selectedId === inc.id;

            return (
              <button
                key={inc.id}
                onClick={() => setSelectedId(inc.id)}
                style={pos}
                className={`absolute z-20 flex flex-col items-center group transition-transform -translate-x-1/2 -translate-y-1/2 ${
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
                  {inc.id.slice(0, 8)}
                </span>
              </button>
            );
          })}

          {incidents.length === 0 && (
            <span className="text-slate-500 font-mono text-xs z-30">No incidents to plot</span>
          )}
        </div>

        {/* TARGET DOSSIER & TELEMETRY */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {selectedIncident ? (
            <div className="bento-card bento-card-critical flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-red-950/60">
                  <span className="text-[11px] font-mono tracking-widest text-red-400 uppercase font-bold flex items-center gap-1.5">
                    <Crosshair className="w-4 h-4 text-red-500" />
                    TARGET SECTOR LOCK
                  </span>
                  <span className="text-[10px] font-mono text-red-400 font-bold">
                    {selectedIncident.id.slice(0, 8)}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-100">{selectedIncident.title}</h3>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-3 font-mono">{selectedIncident.description}</p>
                </div>

                <div className="space-y-1.5 text-xs font-mono pt-2">
                  <div className="flex justify-between text-slate-400">
                    <span>SECTOR:</span>
                    <span className="text-slate-200">{selectedIncident.location.building || '—'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>FLOOR / ZONE:</span>
                    <span className="text-slate-200">{selectedIncident.location.floor || '—'} // {selectedIncident.location.zone_id || '—'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>SEVERITY:</span>
                    <span className="text-red-400 font-bold">{selectedIncident.severity}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>ASSIGNED:</span>
                    <span className="text-cyan-400">{selectedIncident.assigned_responder_id || 'AUTO-DISPATCHING'}</span>
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

          <div className="bento-card bento-card-info space-y-2">
            <span className="text-[11px] font-mono tracking-widest text-cyan-300 uppercase font-bold flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              POSTGIS SPATIAL TELEMETRY
            </span>
            <p className="text-[11px] text-slate-300 font-mono">
              {responders.length} responders, {zones.length} zones, {incidents.length} incidents plotted from live coordinates.
            </p>
          </div>
        </div>

      </div>
      )}
    </div>
  );
}
