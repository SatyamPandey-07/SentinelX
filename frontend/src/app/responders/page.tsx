'use client';

import React, { useState } from 'react';
import { Users, UserCheck, Shield, Phone, Radio, MapPin, Search, Lock, Activity, Award } from 'lucide-react';
import { MOCK_RESPONDERS, Responder } from '@/lib/mock-data';

export default function RespondersPage() {
  const [responders, setResponders] = useState<Responder[]>(MOCK_RESPONDERS);
  const [search, setSearch] = useState('');

  const filtered = responders.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.skills.some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  const availableCount = responders.filter(r => r.status === 'AVAILABLE').length;

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
            LOCATION-BASED gRPC EVALUATION // REDIS DISTRIBUTED MUTEX LOCKING ACTIVE
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search responder or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>
      </div>

      {/* ========================================================
          BENTO TELEMETRY SUMMARY ROW
          ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Bento 1: Fleet Availability */}
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
            Average deployment time: 14s
          </p>
        </div>

        {/* Bento 2: Distributed Lock State */}
        <div className="bento-card bento-card-info flex flex-col justify-between">
          <span className="text-[11px] font-mono tracking-widest text-cyan-300 uppercase font-bold flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-cyan-400" />
            REDIS SETNX MUTEX
          </span>
          <div className="my-3">
            <span className="text-3xl font-black text-cyan-300 font-mono">RACE-FREE</span>
            <span className="text-xs text-slate-300 font-mono block mt-1">10s TTL on active claim tokens</span>
          </div>
          <p className="text-[11px] font-mono text-slate-400 pt-2 border-t border-cyan-950/60">
            Guarantees 0 double-assignments under concurrent spikes
          </p>
        </div>

        {/* Bento 3: Multi-Criteria Weights */}
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

      {/* ========================================================
          BENTO RESPONDER CARDS
          ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((r) => (
          <div
            key={r.id}
            className="bento-card space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-100 font-mono">{r.name}</h2>
                  <span className="text-[10px] font-mono text-slate-400">{r.id}</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-500" />
                  <span>{r.phone}</span>
                </div>
              </div>

              <span className={`text-[10px] px-2.5 py-0.5 rounded font-mono font-bold uppercase ${
                r.status === 'AVAILABLE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                r.status === 'EN_ROUTE' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              }`}>
                {r.status}
              </span>
            </div>

            {/* Skills Tags */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Certified Skills</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {r.skills.map((skill) => (
                  <span key={skill} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Workload & Coordinates */}
            <div className="pt-3 border-t border-slate-800 text-xs font-mono space-y-1.5 text-slate-400">
              <div className="flex items-center justify-between">
                <span>ACTIVE LOAD:</span>
                <span className={`font-bold ${r.active_incidents > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
                  {r.active_incidents} INCIDENTS
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
    </div>
  );
}
