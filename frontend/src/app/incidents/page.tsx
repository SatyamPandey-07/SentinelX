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
  X
} from 'lucide-react';
import { MOCK_INCIDENTS, Incident } from '@/lib/mock-data';

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>(MOCK_INCIDENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // New incident form state
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <span>INCIDENT ROSTER &amp; TRIAGE</span>
            <span className="text-xs px-2 py-0.5 rounded bg-surface-elevated text-slate-400 font-mono">
              {filtered.length} RECORDS
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            TRANSACTIONAL OUTBOX EVENTS // OPENSEARCH DUPLICATE DETECTOR ACTIVE
          </p>
        </div>

        <button
          onClick={() => setIsReportModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold tracking-wide transition-all shadow-lg shadow-red-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>NEW EMERGENCY REPORT</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Search */}
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by ID, keyword, building, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface border border-border text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Severity Filter */}
        <div>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Severity: All</option>
            <option value="CRITICAL">Critical Priority</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Status: All</option>
            <option value="REPORTED">Reported</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* Incidents List */}
      <div className="space-y-3">
        {filtered.map((incident) => (
          <div
            key={incident.id}
            className="p-4 rounded-xl bg-surface border border-border hover:border-slate-700 transition-all space-y-3"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-slate-400">{incident.id}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                    incident.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                    incident.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                    incident.severity === 'MEDIUM' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' :
                    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  }`}>
                    {incident.severity}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-surface-elevated text-slate-300 font-mono">
                    {incident.category}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                    incident.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400' :
                    incident.status === 'ASSIGNED' ? 'bg-blue-500/20 text-blue-300' :
                    'bg-amber-500/20 text-amber-300'
                  }`}>
                    {incident.status}
                  </span>
                </div>

                <h2 className="text-sm font-semibold text-slate-100">{incident.title}</h2>
                <p className="text-xs text-slate-400">{incident.description}</p>
              </div>

              <Link
                href={`/incidents/${incident.id}`}
                className="px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors font-mono shrink-0 flex items-center gap-1"
              >
                <span>DETAILS</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] font-mono text-slate-400 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-slate-300">
                  <MapPin className="w-3 h-3 text-hud-cyan" />
                  <span>{incident.location.building} // {incident.location.floor}</span>
                </span>
                <span>REPORTED BY: {incident.reporter_id}</span>
              </div>

              <div className="flex items-center gap-3">
                {incident.assigned_responder_name && (
                  <span className="text-blue-400 font-medium">UNIT: {incident.assigned_responder_name}</span>
                )}
                <span className="text-slate-500">{new Date(incident.created_at).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-bold tracking-wider text-slate-100 font-mono flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emergency-critical" />
                <span>DISPATCH EMERGENCY INCIDENT</span>
              </h3>
              <button onClick={() => setIsReportModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-mono mb-1">INCIDENT TITLE</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chemical solvent spill in chem lab"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-mono mb-1">DESCRIPTION</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detailed description of threat, affected persons, hazards..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-mono mb-1">CATEGORY</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border text-slate-100 focus:outline-none"
                  >
                    <option value="FIRE">FIRE</option>
                    <option value="MEDICAL">MEDICAL</option>
                    <option value="SECURITY">SECURITY</option>
                    <option value="HAZMAT">HAZMAT</option>
                    <option value="INFRASTRUCTURE">INFRASTRUCTURE</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-mono mb-1">SEVERITY</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border text-slate-100 focus:outline-none"
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
                  <label className="block text-slate-300 font-mono mb-1">BUILDING</label>
                  <input
                    type="text"
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-mono mb-1">FLOOR / ROOM</label>
                  <input
                    type="text"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface-elevated text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold"
                >
                  DISPATCH VIA TRANSACTIONAL OUTBOX
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
