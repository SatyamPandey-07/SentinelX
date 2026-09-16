'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Flame,
  HeartPulse,
  Shield,
  MapPin,
  Clock,
  PhoneCall,
  Send,
  CheckCircle2,
  AlertTriangle,
  Radio,
  User,
  Activity,
  Sparkles,
  Phone,
  HelpCircle,
  FileText,
  Navigation,
  Check,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { getSession, AuthSession } from '@/lib/auth';
import { createIncident, listIncidents, Incident, IncidentCategory, ApiError } from '@/lib/api';

const EMERGENCY_NUMBERS = [
  { name: 'Campus Police Emergency', number: '+1 (555) 911-0001', ext: 'Ext. 5555', role: 'Immediate armed & safety response' },
  { name: 'Campus Paramedics & EMS', number: '+1 (555) 911-0002', ext: 'Ext. 5556', role: 'Trauma, AED, cardiac & medical' },
  { name: 'Fire & Hazmat Dispatch', number: '+1 (555) 911-0003', ext: 'Ext. 5557', role: 'Fire alarm & hazardous chemicals' },
  { name: '24/7 Campus Crisis Hotline', number: '+1 (555) 911-0004', ext: 'Ext. 5558', role: 'Confidential mental health & safety' },
];

export default function UserPortalPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'MEDICAL' | 'FIRE' | 'SECURITY' | 'INFRASTRUCTURE' | 'OTHER'>('MEDICAL');
  const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [building, setBuilding] = useState('Engineering Block A');
  const [floor, setFloor] = useState('2nd Floor, Room 204');

  const syncIncidents = async (currentSession: AuthSession | null) => {
    try {
      const page = await listIncidents({ size: 50 });
      const mine = currentSession
        ? page.content.filter((i) => i.reporter_id === currentSession.user_id)
        : page.content;
      setIncidents(mine);
    } catch {
      // Real backend unreachable -- show nothing rather than fabricate data.
      setIncidents([]);
    }
  };

  useEffect(() => {
    const curSession = getSession();
    setSession(curSession);
    syncIncidents(curSession);

    const onAuthChange = () => setSession(getSession());
    window.addEventListener('sentinelx_auth_change', onAuthChange);

    return () => {
      window.removeEventListener('sentinelx_auth_change', onAuthChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitIncident = async (input: {
    title: string;
    description: string;
    category: IncidentCategory;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    building: string;
    floor: string;
  }) => {
    // Real GPS when the browser grants it, otherwise a campus-quad default --
    // never fabricated per-incident coordinates.
    const coords = await new Promise<{ lat: number; lon: number }>((resolve) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        resolve({ lat: 37.7749, lon: -122.4194 });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => resolve({ lat: 37.7749, lon: -122.4194 }),
        { timeout: 2000 }
      );
    });

    const created = await createIncident({
      title: input.title,
      description: input.description,
      category: input.category,
      severity: input.severity,
      location: {
        latitude: coords.lat,
        longitude: coords.lon,
        building: input.building,
        floor: input.floor,
        zone_id: 'ZONE_NORTH',
        address: 'Campus Quad',
      },
    });

    setIncidents((prev) => [created, ...prev]);
    return created;
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorToast(null);

    try {
      const created = await submitIncident({ title, description, category, severity, building, floor });
      setSuccessToast(`Emergency Incident ${created.id.slice(0, 8)} received! SentinelX Dispatch and nearest responders have been alerted.`);
      setTitle('');
      setDescription('');
      setTimeout(() => setSuccessToast(null), 6000);
    } catch (err) {
      setErrorToast(err instanceof ApiError ? err.message : 'Could not reach SentinelX Dispatch. Please try again.');
      setTimeout(() => setErrorToast(null), 6000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSos = async () => {
    setErrorToast(null);
    try {
      const created = await submitIncident({
        title: '🚨 IMMEDIATE PANIC / SOS SIGNAL ACTIVATED',
        description: 'Instant distress signal triggered by campus community reporter. GPS telemetry broadcast to campus police and nearest patrol units.',
        category: 'SECURITY',
        severity: 'CRITICAL',
        building: 'Current GPS Geofence',
        floor: 'Outdoor Beacon',
      });
      setSuccessToast(`SOS SIGNAL BROADCAST! Incident ${created.id.slice(0, 8)} -- tactical dispatch units and security patrols are en route.`);
      setTimeout(() => setSuccessToast(null), 7000);
    } catch (err) {
      setErrorToast(err instanceof ApiError ? err.message : 'SOS failed to reach SentinelX Dispatch. Call emergency services directly.');
      setTimeout(() => setErrorToast(null), 7000);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Top Banner: User Mode Active */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900/80 to-slate-950 border border-cyan-500/30 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black font-mono tracking-wide text-white">
                CAMPUS SAFETY PORTAL
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                USER MODE
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Welcome, <strong className="text-slate-200">{session?.first_name ? `${session.first_name} ${session.last_name}` : (session?.username || 'Campus Member')}</strong>. Report emergencies, track responder response, and view safety radar.
            </p>
          </div>
        </div>

        {/* Big SOS Emergency Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSos}
          id="btn-emergency-sos"
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-mono font-black text-xs tracking-wider flex items-center gap-2 shadow-lg shadow-red-600/40 border border-red-400/50 uppercase shrink-0 animate-pulse"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>TRIGGER INSTANT SOS</span>
        </motion.button>
      </div>

      {/* Success / Error Notification Toast */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center gap-3 shadow-lg shadow-emerald-950/40"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </motion.div>
        )}
        {errorToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-red-950/40 border border-red-500/50 text-red-300 text-xs font-mono flex items-center gap-3 shadow-lg shadow-red-950/40"
          >
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{errorToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ========================================================
            LEFT COLUMN: EMERGENCY REPORT FORM (7 COLS)
            ======================================================== */}
        <div className="lg:col-span-7 space-y-6" id="report">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/[0.08] backdrop-blur-md space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-2.5">
                <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
                <h2 className="text-base font-bold font-mono text-white tracking-wide">
                  REPORT AN INCIDENT / HAZARD
                </h2>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Direct link to Campus Dispatch
              </span>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-4 text-xs font-mono">
              {/* Category Picker */}
              <div>
                <label className="block text-slate-300 font-bold mb-2">INCIDENT TYPE</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'MEDICAL', label: 'Medical Injury / Illness', icon: HeartPulse, color: 'text-red-400' },
                    { id: 'FIRE', label: 'Fire / Smoke / Gas', icon: Flame, color: 'text-amber-400' },
                    { id: 'SECURITY', label: 'Security / Threat', icon: ShieldAlert, color: 'text-purple-400' },
                    { id: 'INFRASTRUCTURE', label: 'Facility Failure / Leak', icon: Activity, color: 'text-cyan-400' },
                    { id: 'OTHER', label: 'General Hazard / Alert', icon: AlertTriangle, color: 'text-emerald-400' },
                  ].map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id as any)}
                        className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                          isSelected
                            ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-500/10'
                            : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-400'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${cat.color}`} />
                        <span className={`text-[11px] font-semibold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                          {cat.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">BRIEF SUMMARY</label>
                <input
                  type="text"
                  required
                  id="incident-title"
                  placeholder="e.g. Chemical smell in Chemistry lab, or student injured on stairs"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">DETAILED DESCRIPTION</label>
                <textarea
                  required
                  rows={3}
                  id="incident-desc"
                  placeholder="Provide any critical context: number of people affected, visible smoke/fire, responsiveness, hazards..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-colors"
                />
              </div>

              {/* Location selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">CAMPUS BUILDING</label>
                  <select
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
                  >
                    <option value="Engineering Block A">Engineering Block A</option>
                    <option value="Science & Chemistry Hall">Science & Chemistry Hall</option>
                    <option value="Main Library">Main Library</option>
                    <option value="Student Union Building">Student Union Building</option>
                    <option value="Residence Hall North">Residence Hall North</option>
                    <option value="Athletic Pavilion">Athletic Pavilion</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">FLOOR / ROOM / AREA</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2nd Floor Room 204 or East Stairwell"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              {/* Severity / Urgency */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">URGENCY LEVEL</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'LOW', label: 'Low', color: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20' },
                    { id: 'MEDIUM', label: 'Medium', color: 'border-cyan-500/40 text-cyan-400 bg-cyan-950/20' },
                    { id: 'HIGH', label: 'High', color: 'border-amber-500/40 text-amber-400 bg-amber-950/20' },
                    { id: 'CRITICAL', label: 'Critical', color: 'border-red-500/40 text-red-400 bg-red-950/20' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSeverity(s.id as any)}
                      className={`py-2 rounded-xl border text-center font-bold text-xs transition-all ${
                        severity === s.id
                          ? `${s.color} ring-1 ring-white/20 font-black`
                          : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                id="btn-submit-report"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold font-mono tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'TRANSMITTING DISPATCH...' : 'SUBMIT EMERGENCY REPORT'}</span>
              </motion.button>
            </form>
          </div>
        </div>

        {/* ========================================================
            RIGHT COLUMN: MY INCIDENTS & HOTLINES (5 COLS)
            ======================================================== */}
        <div className="lg:col-span-5 space-y-6">
          {/* My Incidents Tracker */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/[0.08] backdrop-blur-md space-y-4" id="my-incidents">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold font-mono text-white tracking-wide">
                  MY REPORTED INCIDENTS ({incidents.length})
                </h2>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                LIVE SYNC
              </span>
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {incidents.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="font-bold text-slate-200">{item.id}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                        item.severity === 'CRITICAL'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : item.severity === 'HIGH'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-white">{item.title}</div>
                  <div className="text-[11px] text-slate-400 leading-snug">{item.description}</div>

                  <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-slate-800/60">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>{item.location?.building || 'Campus Quad'}</span>
                    </div>
                    <span>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {item.assigned_responder_id && (
                    <div className="p-2 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 flex items-center justify-between">
                      <span>Assigned responder: {item.assigned_responder_id}</span>
                      <span className="text-emerald-400 font-bold">READY</span>
                    </div>
                  )}
                </div>
              ))}
              {incidents.length === 0 && (
                <div className="p-4 text-center text-[11px] font-mono text-slate-500">
                  No incidents reported yet. Submit one on the left to see it appear here in real time.
                </div>
              )}
            </div>
          </div>

          {/* Campus Safety Direct Lines */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/[0.08] backdrop-blur-md space-y-4" id="contacts">
            <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold font-mono text-white tracking-wide">
                EMERGENCY CONTACT DIRECTORY
              </h2>
            </div>

            <div className="space-y-2.5">
              {EMERGENCY_NUMBERS.map((num) => (
                <div
                  key={num.name}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70 flex items-center justify-between text-xs font-mono hover:border-slate-700 transition-colors"
                >
                  <div>
                    <div className="font-bold text-slate-200">{num.name}</div>
                    <div className="text-[10px] text-slate-400">{num.role}</div>
                  </div>
                  <a
                    href={`tel:${num.number}`}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-emerald-400 font-bold text-[11px] flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{num.ext}</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
