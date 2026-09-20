'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { UserCheck, Lock, Award, Search, Loader2, AlertTriangle, Radar } from 'lucide-react';
import { listResponders, Responder, ApiError } from '@/lib/api';

export default function RespondersPage() {
  const [responders, setResponders] = useState<Responder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      setResponders(await listResponders());
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Unable to reach location-service');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const poll = setInterval(load, 10000);
    return () => clearInterval(poll);
  }, [load]);

  const filtered = responders.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.skills.toLowerCase().includes(search.toLowerCase())
  );

  const availableCount = responders.filter((r) => r.status === 'AVAILABLE').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5 font-mono uppercase">
            <span>RESPONDER FLEET MATRIX</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-mono border border-slate-700">
              {responders.length} UNITS
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            LIVE FROM location-service // GET /api/v1/location/responders
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="text"
            aria-label="Filter responder units by callsign or skill certification"
            placeholder="Search responder or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Telemetry Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bento-card bento-card-success flex flex-col justify-between">
          <span className="text-[11px] font-mono tracking-widest text-emerald-400 uppercase font-bold flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            STANDBY READINESS
          </span>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400 font-mono">{availableCount}</span>
            <span className="text-base text-slate-400 font-mono">/ {responders.length}</span>
            <span className="text-xs text-emerald-300 font-mono ml-2">READY FOR IMMEDIATE DISPATCH</span>
          </div>
          <p className="text-[11px] font-mono text-slate-400 pt-2 border-t border-emerald-950/60">
            Status/location read directly from location-service's responder table
          </p>
        </div>

        <div className="bento-card bento-card-info flex flex-col justify-between">
          <span className="text-[11px] font-mono tracking-widest text-cyan-300 uppercase font-bold flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-cyan-400" />
            REDIS SETNX MUTEX
          </span>
          <div className="my-3">
            <span className="text-3xl font-black text-cyan-300 font-mono">RACE-FREE</span>
            <span className="text-xs text-slate-300 font-mono block mt-1">assignment-service claims via distributed lock</span>
          </div>
          <p className="text-[11px] font-mono text-slate-400 pt-2 border-t border-cyan-950/60">
            Guarantees 0 double-assignments under concurrent spikes
          </p>
        </div>

        <div className="bento-card flex flex-col justify-between">
          <span className="text-[11px] font-mono tracking-widest text-purple-300 uppercase font-bold flex items-center gap-1.5">
            <Award className="w-4 h-4 text-purple-400" />
            SCORING ENGINE WEIGHTS
          </span>
          <div className="my-2 space-y-1 text-xs font-mono">
            <div className="flex justify-between text-slate-300">
              <span>Geospatial Distance:</span>
              <span className="text-cyan-400 font-bold">45%</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Skill Certification:</span>
              <span className="text-purple-400 font-bold">35%</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Workload Capacity:</span>
              <span className="text-emerald-400 font-bold">20%</span>
            </div>
          </div>
          <p className="text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
            Evaluated via Assignment Service
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 font-mono text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          LOADING RESPONDER FLEET...
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((r) => (
          <div key={r.id} className="bento-card space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-100 font-mono">{r.name}</h2>
                  <span className="text-[10px] font-mono text-slate-400">{r.id}</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                  <Radar className="w-3 h-3 text-slate-500" />
                  <span>Updated {new Date(r.lastLocationUpdate).toLocaleTimeString()}</span>
                </div>
              </div>

              <span
                role="status"
                aria-label={`Operational status: ${r.status}`}
                className={`text-[10px] px-2.5 py-0.5 rounded font-mono font-bold uppercase ${
                  r.status === 'AVAILABLE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  r.status === 'EN_ROUTE' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                  'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                }`}
              >
                {r.status}
              </span>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Certified Skills</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {r.skills.split(',').filter(Boolean).map((skill) => (
                  <span key={skill} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 text-xs font-mono space-y-1.5 text-slate-400">
              <div className="flex items-center justify-between">
                <span>ACTIVE LOAD:</span>
                <span className={`font-bold ${r.activeIncidents > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
                  {r.activeIncidents} INCIDENTS
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span>GPS RADAR:</span>
                <span className="text-cyan-400">{r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
