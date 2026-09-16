'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, 
  Flame, 
  HeartPulse, 
  Radio, 
  ArrowRight, 
  Cpu, 
  Layers, 
  Clock, 
  CheckCircle2, 
  UserCheck, 
  Activity, 
  Database, 
  Zap, 
  Compass, 
  Lock,
  ChevronRight,
  Shield,
  Bot,
  Terminal,
  Crosshair,
  Server,
  MapPin,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { gsap } from 'gsap';
import { Campus3DVisualizer } from '@/components/Campus3DVisualizer';
import { MOCK_INCIDENTS, MOCK_SERVICES_HEALTH } from '@/lib/mock-data';
import { SafeSignedIn as SignedIn, SafeSignedOut as SignedOut, SafeUserButton as UserButton } from '@/components/ClerkGate';

export default function LandingPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [livePulse, setLivePulse] = useState(2481);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  // GSAP Entrance Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.from(badgeRef.current, {
        y: -20,
        opacity: 0,
        duration: 0.8,
      })
      .from(titleRef.current, {
        y: 30,
        opacity: 0,
        duration: 1.0,
      }, '-=0.5')
      .from(ctaRef.current, {
        y: 20,
        opacity: 0,
        duration: 0.7,
      }, '-=0.4')
      .from(statsRef.current, {
        y: 25,
        opacity: 0,
        duration: 0.8,
      }, '-=0.5');
    }, heroRef);

    return () => ctx.revert();
  }, []);

  // Step cycling for the real-time event pipeline
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 5);
      setLivePulse((prev) => prev + Math.floor(Math.random() * 5 - 2));
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  const pipelineSteps = [
    { 
      label: "01. SIGNAL INGESTION", 
      title: "Geospatial Ingestion", 
      detail: "Critical Medical Signal Ingested via PostGIS spatial trigger", 
      color: "text-red-400 border-red-500/40 bg-red-950/30",
      accent: "from-red-500/20 to-red-900/10"
    },
    { 
      label: "02. AI TRIAGE", 
      title: "Autonomous Classification", 
      detail: "DeepSeek LLM + RAG vector lookup achieves 97.4% triage confidence", 
      color: "text-purple-400 border-purple-500/40 bg-purple-950/30",
      accent: "from-purple-500/20 to-purple-900/10"
    },
    { 
      label: "03. KRaft LOG", 
      title: "Event Streaming Backbone", 
      detail: "Partition key INC-00921 published to 3-node distributed Kafka quorum", 
      color: "text-cyan-400 border-cyan-500/40 bg-cyan-950/30",
      accent: "from-cyan-500/20 to-cyan-900/10"
    },
    { 
      label: "04. DISTRIBUTED LOCK", 
      title: "Redis SETNX Consensus", 
      detail: "Responder Unit #R-104 atomically assigned with zero race condition", 
      color: "text-emerald-400 border-emerald-500/40 bg-emerald-950/30",
      accent: "from-emerald-500/20 to-emerald-900/10"
    },
    { 
      label: "05. DISPATCH EXECUTION", 
      title: "SLA Resolution Engine", 
      detail: "Real-time dispatch executed under 1.8 minutes target threshold", 
      color: "text-blue-400 border-blue-500/40 bg-blue-950/30",
      accent: "from-blue-500/20 to-blue-900/10"
    },
  ];

  return (
    <div className="w-full min-h-screen bg-[#060911] text-[#EDEDED] font-sans antialiased">
      
      {/* ========================================================
          TACTICAL GLOW BACKGROUND & GRID
          ======================================================== */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[20%] w-[800px] h-[500px] bg-gradient-to-br from-cyan-600/10 via-purple-600/5 to-transparent rounded-full blur-[120px]" />
        <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-tl from-red-600/10 via-slate-800/10 to-transparent rounded-full blur-[140px]" />
      </div>

      {/* ========================================================
          MISSION CONTROL TOP NAVIGATION
          ======================================================== */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#060911]/85 backdrop-blur-xl px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-500/10 group-hover:border-cyan-300 transition-colors">
              <Shield className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <span className="text-base font-black tracking-widest text-white font-mono uppercase">SENTINELX</span>
              <span className="text-[10px] text-cyan-400/90 font-mono ml-2.5 px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/30">
                CAMPUS DEFENSE
              </span>
            </div>
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-7 text-xs font-mono text-slate-400">
          <Link href="/user" className="hover:text-cyan-400 transition-colors text-cyan-400 font-semibold">USER PORTAL</Link>
          <Link href="/dashboard" className="hover:text-red-400 transition-colors text-red-400 font-semibold">ADMIN COMMAND</Link>
          <a href="#visualizer-3d" className="hover:text-cyan-400 transition-colors">3D DEFENSE GRID</a>
          <a href="#pipeline" className="hover:text-cyan-400 transition-colors">EVENT PIPELINE</a>
          <Link href="/map" className="hover:text-white transition-colors">RADAR MAP</Link>
          <Link href="/system-health" className="hover:text-white transition-colors">SYSTEM HEALTH</Link>
        </nav>

        <div className="flex items-center gap-2.5">
          <SignedOut>
            <Link
              href="/login?mode=signin"
              id="nav-signin"
              className="px-3.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-mono font-bold transition-all border border-slate-700"
            >
              SIGN IN
            </Link>

            <Link
              href="/login?mode=signup"
              id="nav-signup"
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white text-xs font-bold font-mono tracking-wider transition-all shadow-lg shadow-cyan-600/25 flex items-center gap-1.5 border border-cyan-400/30"
            >
              <span>SIGN UP</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </SignedOut>

          <SignedIn>
            <Link
              href="/user"
              className="px-3.5 py-1.5 rounded-lg bg-cyan-950/50 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold hover:bg-cyan-900/60 transition-colors"
            >
              MY SAFETY PORTAL
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </header>

      {/* ========================================================
          HERO SECTION: 3D SPLINE / THREE.JS GUARDNET
          ======================================================== */}
      <section ref={heroRef} className="relative pt-12 pb-16 px-6 max-w-7xl mx-auto z-10">
        
        {/* Tactical Status Tag */}
        <div ref={badgeRef} className="flex justify-center mb-5">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-cyan-500/30 text-cyan-400 font-mono text-xs shadow-md shadow-cyan-950/50 backdrop-blur-md">
            <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            <span className="font-semibold tracking-wider">DEFENSE GRID ACTIVE</span>
            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
            <span className="text-slate-400">LATENCY &lt; 12ms</span>
            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
            <span className="text-emerald-400">KRaft QUORUM READY</span>
          </div>
        </div>

        {/* Hero Headline */}
        <div className="text-center max-w-4xl mx-auto space-y-4 mb-8">
          <h1 ref={titleRef} className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white font-mono uppercase leading-none">
            DISTRIBUTED ZERO-LATENCY <br />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
              CAMPUS DEFENSE & DISPATCH
            </span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto font-sans leading-relaxed">
            Mission-critical distributed emergency response orchestration. Automated geospatial triage,
            atomic distributed lock consensus, and 3D spatial intelligence for enterprise security commands.
          </p>
        </div>

        {/* CTAs with User Mode and Admin Mode routes */}
        <div ref={ctaRef} className="flex flex-wrap items-center justify-center gap-4 mb-10">
          <Link
            href="/login?mode=signup&role=user"
            id="hero-signup-user"
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-xs tracking-wider transition-all shadow-xl shadow-cyan-600/30 flex items-center gap-2 border border-cyan-400/40"
          >
            <Shield className="w-4 h-4" />
            <span>SIGN UP (USER MODE - REPORT SOS)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/login?mode=signin&role=admin"
            id="hero-signin-admin"
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-mono font-bold text-xs tracking-wider transition-all shadow-xl shadow-red-600/30 flex items-center gap-2 border border-red-500/40"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>DISPATCH COMMAND (ADMIN MODE)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <a
            href="#visualizer-3d"
            className="px-6 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-white/[0.1] font-mono text-xs font-semibold tracking-wider transition-all flex items-center gap-2"
          >
            <Crosshair className="w-4 h-4 text-cyan-400" />
            <span>INSPECT 3D DEFENSE GRID</span>
          </a>

          <Link
            href="/sla"
            className="px-6 py-3.5 rounded-xl bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/[0.06] font-mono text-xs tracking-wider transition-all flex items-center gap-2"
          >
            <Activity className="w-4 h-4 text-amber-400" />
            <span>SLA ENGINE MONITOR</span>
          </Link>
        </div>

        {/* Telemetry Numbers Banner */}
        <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto mb-12">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/[0.08] backdrop-blur-md text-center">
            <div className="text-2xl font-bold font-mono text-white">99.998%</div>
            <div className="text-[11px] font-mono text-slate-400">CLUSTER UPTIME</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/[0.08] backdrop-blur-md text-center">
            <div className="text-2xl font-bold font-mono text-cyan-400">&lt; 1.8m</div>
            <div className="text-[11px] font-mono text-slate-400">CRITICAL SLA TARGET</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/[0.08] backdrop-blur-md text-center">
            <div className="text-2xl font-bold font-mono text-purple-400">97.4%</div>
            <div className="text-[11px] font-mono text-slate-400">AI TRIAGE CONFIDENCE</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/[0.08] backdrop-blur-md text-center">
            <div className="text-2xl font-bold font-mono text-emerald-400">0 RACE</div>
            <div className="text-[11px] font-mono text-slate-400">REDIS SETNX LOCKS</div>
          </div>
        </div>

        {/* ========================================================
            3D THREE.JS CAMPUS VISUALIZER COMPONENT
            ======================================================== */}
        <div id="visualizer-3d" className="scroll-mt-24">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
              <span>TACTICAL 3D PROJECTION // THREE.JS WEBGL RENDERER</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              MOUSE PARALLAX ENABLED • CLICK TO SELECT SECTORS
            </div>
          </div>

          <Campus3DVisualizer 
            onSelectBuilding={(name) => setSelectedBuilding(name)}
          />

          {selectedBuilding && (
            <div className="mt-3 p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-xs font-mono text-cyan-300 flex items-center justify-between">
              <span>TARGET SELECTED: <strong>{selectedBuilding}</strong></span>
              <Link href="/dashboard" className="text-white hover:underline flex items-center gap-1 font-bold">
                VIEW SECTOR DOSSIER <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================
          EVENT PIPELINE SECTION (5 STAGES)
          ======================================================== */}
      <section id="pipeline" className="py-20 border-t border-white/[0.08] bg-[#080b14]/70 relative z-10 px-6">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-purple-400 uppercase tracking-wider mb-2">
              <Zap className="w-3.5 h-3.5" />
              <span>Real-Time Autonomous Pipeline</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-mono text-white uppercase">
              From Ingestion to Dispatch in Seconds
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-2 font-sans">
              Distributed synchronization across Kafka KRaft event partitions, AI vector grounding, and Redis distributed locks.
            </p>
          </div>

          {/* Interactive Pipeline Steps */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-8">
            {pipelineSteps.map((step, idx) => {
              const isActive = activeStep === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`cursor-pointer p-4 rounded-xl border transition-all duration-300 ${
                    isActive 
                      ? `${step.color} shadow-lg shadow-black/50 scale-[1.02]` 
                      : 'border-white/[0.06] bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="text-[10px] font-mono tracking-wider mb-1 font-semibold">
                    {step.label}
                  </div>
                  <div className="text-sm font-bold font-mono text-white mb-2">
                    {step.title}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {step.detail}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Pipeline Active Node Simulation Log */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-white/[0.08] font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 mb-3">
              <div className="flex items-center gap-2 text-slate-400">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>KAFKA EVENT LOG STREAM // TOPIC: emergency.incidents.v1</span>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                CONSUMING
              </span>
            </div>
            <div className="text-slate-300 space-y-1 text-[11px]">
              <div><span className="text-slate-500">[00:34:18.421]</span> <span className="text-cyan-400">INGEST:</span> GeoTrigger event received from Sector B [lat: 37.7749, lng: -122.4194]</div>
              <div><span className="text-slate-500">[00:34:18.590]</span> <span className="text-purple-400">AI_INFER:</span> DeepSeek classification returned CRITICAL_MEDICAL (0.974 confidence)</div>
              <div><span className="text-slate-500">[00:34:18.612]</span> <span className="text-emerald-400">LOCK_ACQUIRED:</span> Redis SETNX lock:responder:R-104 ttl=300000ms SUCCESS</div>
              <div><span className="text-slate-500">[00:34:18.730]</span> <span className="text-blue-400">DISPATCH:</span> Unit R-104 routed via PostGIS ST_DWithin radius (est. arrival: 1.4m)</div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================
          GUARDNET SECURITY BENTO GRID (ARCHITECTURE)
          ======================================================== */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto z-10 relative">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>High-Assurance Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-mono text-white uppercase">
            Engineered for High-Stakes Operations
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-2 font-sans">
            Built with zero-single-point-of-failure distributed patterns across Java 21, Python AI, and PostGIS.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Bento Card 1: Geospatial Engine */}
          <div className="bento-card group">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4 group-hover:border-cyan-400 transition-colors">
              <Compass className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="text-base font-bold font-mono text-white mb-2">
              PostGIS Proximity Engine
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Executes spatial queries with sub-10ms indexing across campus boundaries. Calculates real-time Euclidean and road-network distance for rapid emergency unit routing.
            </p>
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>INDEX: SP-GIST</span>
              <span className="text-cyan-400">RADIUS: 500M</span>
            </div>
          </div>

          {/* Bento Card 2: AI Triage & Grounded RAG */}
          <div className="bento-card group">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-4 group-hover:border-purple-400 transition-colors">
              <Bot className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-base font-bold font-mono text-white mb-2">
              DeepSeek & Qdrant RAG
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Autonomous intent triage and protocol retrieval. Cross-references real-time emergency signals against vectorized SOPs to suggest immediate containment strategies.
            </p>
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>MODEL: FASTAPI AI</span>
              <span className="text-purple-400">CONFIDENCE: 97.4%</span>
            </div>
          </div>

          {/* Bento Card 3: Distributed Consensus */}
          <div className="bento-card group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 group-hover:border-emerald-400 transition-colors">
              <Lock className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-base font-bold font-mono text-white mb-2">
              Redis SETNX Atomic Locks
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Prevents duplicate dispatch race conditions when multiple operators or automated triggers respond simultaneously. Guaranteed single-responder ownership.
            </p>
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>CONSENSUS: REDIS 7</span>
              <span className="text-emerald-400">RACES: 0</span>
            </div>
          </div>

          {/* Bento Card 4: Immutable Audit Ledger (Wide) */}
          <div className="bento-card md:col-span-2 group">
            <div className="flex items-start justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4 group-hover:border-red-400 transition-colors">
                  <Database className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-base font-bold font-mono text-white mb-2">
                  Cryptographic Audit Chain (SHA-256)
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xl mb-4">
                  Every status transition, operator acknowledgement, and responder route update is written into an append-only cryptographic ledger. Backed by SHA-256 block hashing for non-repudiation.
                </p>
              </div>
              <div className="hidden sm:block text-right font-mono text-[11px] text-slate-500">
                <div>HASH: e3b0c44298fc1c149afbf4c8...</div>
                <div className="text-emerald-400 mt-1">TAMPER-PROOF VERIFIED</div>
              </div>
            </div>
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>STORAGE: POSTGRESQL + POSTGIS</span>
              <Link href="/audit" className="text-red-400 hover:text-red-300 flex items-center gap-1 font-bold">
                VIEW AUDIT LOGS <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Bento Card 5: Real-Time SLA Engine */}
          <div className="bento-card group">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 group-hover:border-amber-400 transition-colors">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-base font-bold font-mono text-white mb-2">
              Sub-2m SLA Engine
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Real-time countdown metrics computed from incident creation timestamp. Escalates automatically if initial responder unit fails to acknowledge.
            </p>
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>TARGET: 2m 00s</span>
              <Link href="/sla" className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold">
                MONITOR SLA <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================
          LIVE INCIDENT PREVIEW STRIP
          ======================================================== */}
      <section className="py-12 border-y border-white/[0.08] bg-[#070a12] px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-red-400 mb-1">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
              <span className="font-bold">ACTIVE DISPATCH QUEUE</span>
            </div>
            <h3 className="text-lg font-bold font-mono text-white">
              INC-2026-00921: Severe Chemical Spill in BioMed Sector B
            </h3>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Assigned to Hazardous Unit H-201 • Dispatch Target: 2.0m • SLA Status: ON TRACK
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/incidents/INC-2026-00921"
              className="px-4 py-2.5 rounded-lg bg-slate-900 border border-white/[0.1] hover:bg-slate-800 text-xs font-mono text-slate-200 transition-colors"
            >
              OPEN INCIDENT DOSSIER
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-mono font-bold text-white transition-all shadow-lg shadow-red-600/30 flex items-center gap-1.5"
            >
              <span>LAUNCH DISPATCH BOARD</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================
          FOOTER (MISSION CONTROL SPECS)
          ======================================================== */}
      <footer className="py-12 border-t border-white/[0.08] bg-[#060911] text-slate-500 text-xs font-mono px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div>
              <span className="text-slate-300 font-bold tracking-wider">VIGIL // GUARDNET</span>
              <span className="ml-2 text-slate-500">DISTRIBUTED EMERGENCY COMMAND v2.4</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <Link href="/dashboard" className="hover:text-cyan-400 transition-colors">DASHBOARD</Link>
            <Link href="/map" className="hover:text-cyan-400 transition-colors">RADAR MAP</Link>
            <Link href="/incidents" className="hover:text-cyan-400 transition-colors">INCIDENTS</Link>
            <Link href="/intelligence" className="hover:text-cyan-400 transition-colors">AI INTELLIGENCE</Link>
            <Link href="/system-health" className="hover:text-cyan-400 transition-colors">SYSTEM HEALTH</Link>
          </div>

          <div className="text-slate-500 text-[11px]">
            © 2026 VIGIL DISTRIBUTED SYSTEMS • ZERO SINGLE POINT OF FAILURE
          </div>
        </div>
      </footer>

    </div>
  );
}
