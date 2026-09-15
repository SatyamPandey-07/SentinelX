'use client';

import React, { useState } from 'react';
import { Users, UserCheck, Shield, Phone, Radio, MapPin, Search } from 'lucide-react';
import { MOCK_RESPONDERS, Responder } from '@/lib/mock-data';

export default function RespondersPage() {
  const [responders, setResponders] = useState<Responder[]>(MOCK_RESPONDERS);
  const [search, setSearch] = useState('');

  const filtered = responders.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.skills.some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <span>RESPONDER FLEET &amp; DEPLOYMENT</span>
            <span className="text-xs px-2 py-0.5 rounded bg-surface-elevated text-slate-400 font-mono">
              {responders.length} ACTIVE UNITS
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            GEOSPATIAL LOCATION TRACKING // REDIS DISTRIBUTED LOCK MUTEX ACTIVE
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface border border-border text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Responder Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((r) => {
          const isAvailable = r.status === 'AVAILABLE';

          return (
            <div
              key={r.id}
              className="p-5 rounded-xl bg-surface border border-border hover:border-slate-700 transition-all space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-100">{r.name}</h2>
                    <span className="text-[10px] font-mono text-slate-400">{r.id}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-500" />
                    <span>{r.phone}</span>
                  </div>
                </div>

                <span className={`text-[10px] px-2.5 py-1 rounded font-mono font-bold uppercase ${
                  r.status === 'AVAILABLE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                  r.status === 'EN_ROUTE' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' :
                  r.status === 'ON_SCENE' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40' :
                  'bg-slate-800 text-slate-300'
                }`}>
                  {r.status}
                </span>
              </div>

              {/* Skills Tags */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Certified Skills</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {r.skills.map((skill) => (
                    <span key={skill} className="text-[10px] px-2 py-0.5 rounded bg-surface-elevated border border-border text-slate-300 font-mono">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Workload & Coordinates */}
              <div className="pt-3 border-t border-border text-xs font-mono space-y-1.5 text-slate-400">
                <div className="flex items-center justify-between">
                  <span>ACTIVE LOAD:</span>
                  <span className={`font-semibold ${r.active_incidents > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
                    {r.active_incidents} INCIDENTS
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span>COORDINATES:</span>
                  <span className="text-hud-cyan">{r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
