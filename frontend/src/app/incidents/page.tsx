'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  Flame,
  MapPin,
  ChevronRight,
  X,
  Layers,
  Database,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { listIncidents, createIncident, Incident, IncidentCategory, IncidentSeverity, ApiError } from '@/lib/api';
import { getSharedIncidents } from '@/lib/incident-store';

const CATEGORIES: IncidentCategory[] = [
  'FIRE', 'MEDICAL', 'SECURITY', 'HAZMAT', 'INFRASTRUCTURE', 'ELECTRICAL',
  'SUSPICIOUS_ACTIVITY', 'HARASSMENT', 'THEFT', 'NATURAL_DISASTER', 'EQUIPMENT_FAILURE', 'OTHER',
];

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IncidentCategory>('FIRE');
  const [severity, setSeverity] = useState<IncidentSeverity>('HIGH');
  const [building, setBuilding] = useState('Science & Chemistry Hall');
  const [floor, setFloor] = useState('2nd Floor');

  const load = useCallback(async () => {
    try {
      const page = await listIncidents({ size: 100 });
      const shared = getSharedIncidents();
      const combined = [...shared, ...page.content.filter((p) => !shared.some((s) => s.id === p.id))];
      setIncidents(combined as any);
      setError(null);
    } catch {
      const shared = getSharedIncidents();
      setIncidents(shared as any);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const poll = setInterval(load, 10000);
    const onUpdated = () => {
      const shared = getSharedIncidents();
      setIncidents(shared as any);
    };
    window.addEventListener('sentinelx_incidents_updated', onUpdated);
    return () => {
      clearInterval(poll);
      window.removeEventListener('sentinelx_incidents_updated', onUpdated);
    };
  }, [load]);

  const filtered = incidents.filter((i) => {
    if (selectedSeverity !== 'ALL' && i.severity !== selectedSeverity) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const match =
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        (i.location.building ?? '').toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const created = await createIncident({
        title,
        description,
        category,
        severity,
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
          building,
          floor,
          zone_id: 'ZONE_NORTH',
          address: 'Campus Ground',
        },
      });
      setIncidents((prev) => [created, ...prev]);
      setIsReportModalOpen(false);
      setTitle('');
      setDescription('');
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : 'Failed to submit incident');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5 font-mono uppercase">
            <span>INCIDENT QUEUE &amp; TRIAGE</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-300 font-mono border border-slate-700">
              {filtered.length} LOADED
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            LIVE FROM POSTGRESQL VIA incident-service (AI classification runs async, on-page reload)
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

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Filter & Telemetry Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
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
            search-service / OpenSearch
          </div>
        </div>

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
            incident-service outbox_events
          </div>
        </div>
      </div>

      {/* Incident Stream */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 font-mono text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          LOADING INCIDENTS...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bento-card text-center py-12 text-slate-400 font-mono text-sm">
          No incidents match. {incidents.length === 0 && 'Report one to get started.'}
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((incident) => {
          const isCritical = incident.severity === 'CRITICAL';
          const isResolved = incident.status === 'RESOLVED' || incident.status === 'CLOSED';

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
                    <span className="text-xs font-mono font-black text-slate-300">{incident.id.slice(0, 8)}</span>
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
                    incident.status === 'RESOLVED' || incident.status === 'CLOSED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
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
                  {incident.location.building || 'No building'} {incident.location.floor && `// ${incident.location.floor}`}
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
      )}

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
                    onChange={(e) => setCategory(e.target.value as IncidentCategory)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">INITIAL SEVERITY</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">BUILDING</label>
                  <input
                    type="text"
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">FLOOR</label>
                  <input
                    type="text"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {formError && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {formError}
                </div>
              )}

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
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
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
