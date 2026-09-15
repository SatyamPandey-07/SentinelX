'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  Plus, 
  Flame, 
  Clock, 
  MapPin, 
  ChevronRight, 
  ShieldAlert, 
  CheckCircle2, 
  X,
  Layers,
  Database,
  Radio
} from 'lucide-react';
import { MOCK_INCIDENTS, Incident } from '@/lib/mock-data';

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>(MOCK_INCIDENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('FIRE');
  const [severity, setSeverity] = useState('HIGH');
  const [building, setBuilding] = useState('Science & Chemistry Hall');
  const [floor, setFloor] = useState('2nd Floor');

  const filtered = incidents.filter(i => {
    if (selectedSeverity !== 'ALL' && i.severity !== selectedSeverity) return false;
    if (selectedStatus !== 'ALL' && i.status !== selectedStatus) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const match = i.title.toLowerCase().includes(q) ||
                    i.description.toLowerCase().includes(q) ||
                    i.location.building.toLowerCase().includes(q) ||
                    i.id.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    const newInc: Incident = {
      id: `INC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      reporter_id: "usr-current",
      title,
      description,
      category: category as any,
      severity: severity as any,
      status: "REPORTED",
      location: {
        latitude: 37.7749,
        longitude: -122.4194,
        building,
        floor,
        zone_id: "ZONE_NORTH",
        address: "Campus Ground"
      },
      sla_ack_deadline: new Date(Date.now() + 1000 * 300).toISOString(),
      created_at: new Date().toISOString()
    };

    setIncidents([newInc, ...incidents]);
    setIsReportModalOpen(false);
    setTitle('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5 font-mono uppercase">
            <span>INCIDENT QUEUE &amp; TRIAGE</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-300 font-mono border border-slate-700">
              {filtered.length} ACTIVE
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            POSTGRESQL TRANSACTIONAL OUTBOX // OPENSEARCH DUP SCANNER ACTIVE
          </p>
        </div>

        <button
          onClick={() => setIsReportModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold font-mono tracking-wider transition-all shadow-lg shadow-red-600/30"
        >
          <Plus className="w-4 h-4" />
          <span>NEW EMERGENCY REPORT</span>
        </button>
      </div>

      {/* ========================================================
          BENTO FILTER & TELEMETRY ROW
          ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Bento Control 1: Query & Filter Console (Col Span 6) */}
        <div className="md:col-span-12 lg:col-span-6 bento-card flex flex-col justify-between">
          <div className="space-y-3">
            <span className="text-[11px] font-mono tracking-widest text-slate-300 uppercase font-bold flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              TRIAGE QUERY ENGINE
            </span>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search incident ID, keyword, hazard, building..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 mt-3 flex items-center gap-2 flex-wrap text-xs font-mono">
            <span className="text-slate-400 text-[11px]">Severity:</span>
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSeverity(s)}
                className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                  selectedSeverity === s 
                    ? 'bg-cyan-500 text-slate-950 font-bold' 
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Bento Control 2: OpenSearch Duplicate Engine (Col Span 3) */}
        <div className="md:col-span-6 lg:col-span-3 bento-card bento-card-info flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[11px] font-mono tracking-widest text-cyan-300 uppercase font-bold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              DUP DETECTION
            </span>
            <p className="text-[11px] text-slate-300">
              Spatial proximity &le; 150m, temporal delta &le; 10m, text cosine &ge; 0.70.
            </p>
          </div>
          <div className="pt-2 border-t border-cyan-950/60 text-[10px] font-mono text-cyan-400">
            OpenSearch Cluster: Active
          </div>
        </div>

        {/* Bento Control 3: Transactional Outbox (Col Span 3) */}
        <div className="md:col-span-6 lg:col-span-3 bento-card bento-card-success flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[11px] font-mono tracking-widest text-emerald-300 uppercase font-bold flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              OUTBOX DURABILITY
            </span>
            <p className="text-[11px] text-slate-300">
              Zero dual-write errors. Atomically written to PostgreSQL and flushed to Kafka.
            </p>
          </div>
          <div className="pt-2 border-t border-emerald-950/60 text-[10px] font-mono text-emerald-400">
            Pending Outbox: 0 events
          </div>
        </div>
      </div>

      {/* ========================================================
          INCIDENT BENTO STREAM
          ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((incident) => {
          const isCritical = incident.severity === 'CRITICAL';
          const isResolved = incident.status === 'RESOLVED';

          return (
            <div
              key={incident.id}
              className={`bento-card flex flex-col justify-between ${
                isCritical ? 'bento-card-critical' : isResolved ? 'opacity-70' : ''
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-black text-slate-300">{incident.id}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                      incident.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                      incident.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                      'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                    }`}>
                      {incident.severity}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      {incident.category}
                    </span>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                    incident.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    incident.status === 'ASSIGNED' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                    'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {incident.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-100">{incident.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{incident.description}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400 flex-wrap gap-2">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  {incident.location.building} // {incident.location.floor}
                </span>

                <Link
                  href={`/incidents/${incident.id}`}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-cyan-950/80 hover:text-cyan-300 text-slate-200 text-xs font-mono font-bold transition-all border border-slate-700 flex items-center gap-1"
                >
                  <span>TRIAGE</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Incident Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bento-card max-w-lg w-full bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-sm font-bold text-slate-100 font-mono uppercase flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-500" />
                <span>REPORT EMERGENCY HAZARD</span>
              </h2>
              <button onClick={() => setIsReportModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">INCIDENT TITLE</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Explosion in Chemistry Wing"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">DETAILED DESCRIPTION</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe location, casualties, hazards, trapped individuals..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-red-500"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">CATEGORY</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                  >
                    <option value="FIRE">FIRE</option>
                    <option value="MEDICAL">MEDICAL</option>
                    <option value="SECURITY">SECURITY</option>
                    <option value="INFRASTRUCTURE">INFRASTRUCTURE</option>
                    <option value="HAZMAT">HAZMAT</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">INITIAL SEVERITY</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold"
                >
                  DISPATCH INCIDENT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
