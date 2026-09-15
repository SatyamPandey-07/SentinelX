'use client';

import React, { useState, useEffect } from 'react';
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
  Server
} from 'lucide-react';
import { MOCK_INCIDENTS, MOCK_RESPONDERS, MOCK_SERVICES_HEALTH } from '@/lib/mock-data';

export default function LandingPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [pulseCount, setPulseCount] = useState(2481);

  // Animate particle step every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 5);
      setPulseCount((prev) => prev + Math.floor(Math.random() * 7 - 3));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const pipelineSteps = [
    { label: "INCIDENT", detail: "Critical Medical Signal Ingested", color: "text-red-400 border-red-500 bg-red-950/40" },
    { label: "AI CLASSIFICATION", detail: "97.4% Confidence & Rule Override", color: "text-purple-400 border-purple-500 bg-purple-950/40" },
    { label: "EVENT STREAM", detail: "Kafka KRaft Partition key: INC-00921", color: "text-cyan-400 border-cyan-500 bg-cyan-950/40" },
    { label: "RESPONDER", detail: "Unit #R-104 Locked via Redis SETNX", color: "text-emerald-400 border-emerald-500 bg-emerald-950/40" },
    { label: "RESOLUTION", detail: "SLA Compliant < 2.0m Response", color: "text-blue-400 border-blue-500 bg-blue-950/40" },
  ];

  return (
    <div className="min-h-screen bg-[#080A0F] text-[#EDEDED] font-sans antialiased selection:bg-cyan-500/20 selection:text-cyan-300">
      
      {/* Top Tactical Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#080A0F]/90 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-500/10">
            <Shield className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <span className="text-base font-black tracking-widest text-white font-mono uppercase">VIGIL</span>
            <span className="text-[10px] text-slate-400 font-mono ml-2.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
              MISSION CONTROL v2.4
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs font-mono text-slate-400">
          <Link href="/dashboard" className="hover:text-white transition-colors">COMMAND CENTER</Link>
          <Link href="/incidents" className="hover:text-white transition-colors">INCIDENTS</Link>
          <Link href="/map" className="hover:text-white transition-colors">LIVE MAP</Link>
          <Link href="/responders" className="hover:text-white transition-colors">RESPONDERS</Link>
          <a href="#architecture" className="hover:text-white transition-colors">ARCHITECTURE</a>
          <a href="#observability" className="hover:text-white transition-colors">OBSERVABILITY</a>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-500/30 px-2.5 py-1 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>SYSTEM OPERATIONAL</span>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold font-mono tracking-wider transition-all shadow-lg shadow-red-600/30 flex items-center gap-1.5"
          >
            <span>LAUNCH DASHBOARD</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* ========================================================
          HERO SECTION: CINEMATIC MISSION CONTROL
          ======================================================== */}
      <section className="relative pt-16 pb-20 px-6 max-w-7xl mx-auto overflow-hidden">
        
        {/* Subtle Background Glow Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-red-600/10 via-cyan-500/10 to-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.1] text-xs font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>CAMPUS DISTRIBUTED INCIDENT ORCHESTRATION</span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-white uppercase font-mono">
            VIGIL
          </h1>

          <p className="text-xl sm:text-2xl font-semibold text-slate-200">
            Real-time intelligence for every incident.
          </p>

          <p className="text-sm sm:text-base text-slate-400 font-mono tracking-wide">
            Detect. Classify. Route. Resolve.
          </p>

          <div className="pt-4 flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/dashboard"
              className="px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold font-mono tracking-wider transition-all shadow-xl shadow-red-600/30 flex items-center gap-2 hover:scale-[1.02]"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              <span>LAUNCH COMMAND CENTER</span>
            </Link>

            <a
              href="#architecture"
              className="px-6 py-3.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.12] text-slate-200 text-sm font-bold font-mono tracking-wider transition-all flex items-center gap-2"
            >
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>EXPLORE ARCHITECTURE</span>
            </a>
          </div>
        </div>

        {/* ========================================================
            INTERACTIVE 3D/ISOMETRIC CAMPUS MAP VISUALIZER
            ======================================================== */}
        <div className="mt-14 relative rounded-2xl border border-white/[0.1] bg-[#0B0E14]/90 p-6 backdrop-blur-xl shadow-2xl overflow-hidden">
          
          {/* Top HUD Frame Bar */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.08] text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-300">
              <Crosshair className="w-4 h-4 text-cyan-400" />
              <span className="font-bold">ISOMETRIC CAMPUS TOPOLOGY // SECTOR RADAR</span>
            </div>
            <div className="flex items-center gap-3 text-slate-400">
              <span>LAT: 37.7749° N</span>
              <span>LON: 122.4194° W</span>
              <span className="text-emerald-400">148 RESPONDERS ACTIVE</span>
            </div>
          </div>

          {/* SVG Isometric Campus Network Graph */}
          <div className="relative h-[380px] w-full flex items-center justify-center select-none">
            
            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:32px_32px] opacity-15"></div>

            {/* Isometric Campus Canvas Visual Elements */}
            <div className="relative w-full max-w-4xl h-full">
              
              {/* Sector Zone Bounds */}
              <div className="absolute top-12 left-16 w-64 h-36 rounded-xl border border-cyan-500/20 bg-cyan-950/10 p-3 flex flex-col justify-between">
                <span className="text-[10px] font-mono text-cyan-400 font-bold">ENGINEERING BLOCK A</span>
                <span className="text-[9px] font-mono text-slate-500">Zone North // Floor 2</span>
              </div>

              <div className="absolute top-8 right-24 w-60 h-32 rounded-xl border border-slate-700/40 bg-slate-900/20 p-3 flex flex-col justify-between">
                <span className="text-[10px] font-mono text-slate-300 font-bold">LABORATORY BLOCK B</span>
                <span className="text-[9px] font-mono text-slate-500">Chemistry & Hazmat Wing</span>
              </div>

              <div className="absolute bottom-12 left-28 w-56 h-32 rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-3 flex flex-col justify-between">
                <span className="text-[10px] font-mono text-emerald-400 font-bold">STUDENT UNION</span>
                <span className="text-[9px] font-mono text-slate-500">Public Quad Sector</span>
              </div>

              <div className="absolute bottom-10 right-20 w-64 h-36 rounded-xl border border-purple-500/20 bg-purple-950/10 p-3 flex flex-col justify-between">
                <span className="text-[10px] font-mono text-purple-400 font-bold">MEDICAL CTR COMPLEX</span>
                <span className="text-[9px] font-mono text-slate-500">EMS Staging Bay</span>
              </div>

              {/* Connecting Road Network Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 900 380">
                <line x1="220" y1="120" x2="650" y2="100" stroke="rgba(255,255,255,0.08)" strokeWidth="2" strokeDasharray="4 4" />
                <line x1="220" y1="120" x2="250" y2="280" stroke="rgba(255,255,255,0.08)" strokeWidth="2" strokeDasharray="4 4" />
                <line x1="250" y1="280" x2="680" y2="300" stroke="rgba(255,255,255,0.08)" strokeWidth="2" strokeDasharray="4 4" />
                <line x1="650" y1="100" x2="680" y2="300" stroke="rgba(255,255,255,0.08)" strokeWidth="2" strokeDasharray="4 4" />
                
                {/* Active Incident Path to Assigned Responder */}
                <line x1="220" y1="130" x2="340" y2="180" stroke="rgba(239, 68, 68, 0.8)" strokeWidth="3" />
                <circle cx="340" cy="180" r="4" fill="#EF4444" className="animate-ping" />
              </svg>

              {/* CRITICAL RED INCIDENT NODE */}
              <div className="absolute top-24 left-44 z-20 flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-red-600/30 border-2 border-red-500 flex items-center justify-center pulse-critical shadow-xl shadow-red-600/50">
                  <Flame className="w-5 h-5 text-red-400 animate-pulse" />
                </div>
                <div className="mt-2 px-2.5 py-1 rounded bg-red-950/90 border border-red-500/50 text-[10px] font-mono font-bold text-red-300">
                  INC-2026-00921 (CRITICAL MEDICAL)
                </div>
              </div>

              {/* RESPONDER NODES */}
              {/* Responder R-104 (Assigned & En Route) */}
              <div className="absolute top-44 left-80 z-20 flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-emerald-500/30 border border-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <UserCheck className="w-4 h-4 text-emerald-300" />
                </div>
                <span className="mt-1 px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-[9px] font-mono text-emerald-400 font-bold">
                  R-104 [320m EN ROUTE]
                </span>
              </div>

              {/* Responder R-221 (Busy) */}
              <div className="absolute bottom-20 left-48 z-10 flex flex-col items-center">
                <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center opacity-75">
                  <Shield className="w-3.5 h-3.5 text-slate-300" />
                </div>
                <span className="mt-1 text-[8px] font-mono text-slate-500">R-221 [1.2km BUSY]</span>
              </div>

              {/* Responder R-119 (Fire Available) */}
              <div className="absolute top-28 right-36 z-10 flex flex-col items-center">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="mt-1 text-[8px] font-mono text-emerald-400">R-119 [740m AVAIL]</span>
              </div>

            </div>
          </div>

          {/* Animated Particle Pipeline Ticker */}
          <div className="mt-4 pt-4 border-t border-white/[0.08]">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {pipelineSteps.map((step, idx) => {
                const isActive = activeStep === idx;
                return (
                  <div
                    key={step.label}
                    className={`p-2.5 rounded-lg border text-xs font-mono transition-all ${
                      isActive 
                        ? `${step.color} scale-[1.02] shadow-lg` 
                        : 'border-white/[0.06] bg-white/[0.02] text-slate-400 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{idx + 1}. {step.label}</span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping"></span>}
                    </div>
                    <div className="text-[10px] mt-1 text-slate-300 truncate">{step.detail}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </section>

      {/* ========================================================
          LIVE SYSTEM METRICS HUD
          ======================================================== */}
      <section className="border-y border-white/[0.08] bg-[#0A0D13] py-8 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">ACTIVE INCIDENTS</span>
            <div className="text-3xl font-black font-mono text-white">12</div>
            <span className="text-[10px] font-mono text-slate-500">Across 3 Sectors</span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">RESPONDERS ONLINE</span>
            <div className="text-3xl font-black font-mono text-emerald-400">148</div>
            <span className="text-[10px] font-mono text-emerald-500/80">92 Available (62%)</span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">CRITICAL INCIDENTS</span>
            <div className="text-3xl font-black font-mono text-red-400">03</div>
            <span className="text-[10px] font-mono text-red-500/80">Priority 1 Triage</span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">SLA COMPLIANCE</span>
            <div className="text-3xl font-black font-mono text-cyan-400">98.7%</div>
            <span className="text-[10px] font-mono text-cyan-500/80">Target &gt; 95%</span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">AVERAGE RESPONSE</span>
            <div className="text-3xl font-black font-mono text-slate-200">01:42</div>
            <span className="text-[10px] font-mono text-slate-500">MTTA P50: 42s</span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">EVENTS / SEC</span>
            <div className="text-3xl font-black font-mono text-purple-400">{pulseCount.toLocaleString()}</div>
            <span className="text-[10px] font-mono text-purple-500/80">Kafka KRaft Bus</span>
          </div>

        </div>
      </section>

      {/* ========================================================
          DISTRIBUTED EVENT PIPELINE ARCHITECTURE SECTION
          ======================================================== */}
      <section id="architecture" className="py-20 px-6 max-w-7xl mx-auto space-y-12">
        <div className="space-y-2 text-center max-w-2xl mx-auto">
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
            TECHNICAL ARCHITECTURE
          </span>
          <h2 className="text-3xl sm:text-4xl font-black font-mono text-white uppercase">
            Distributed Event Pipeline
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Database-Per-Service with Transactional Outbox, Kafka Backbone, Redis Distributed Mutex Locks, and Qdrant Grounded RAG.
          </p>
        </div>

        {/* Interactive Architecture Flow Grid */}
        <div className="p-8 rounded-2xl border border-white/[0.08] bg-[#0A0D14] space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-cyan-400 font-bold">1. API GATEWAY</span>
                <span className="text-[10px] text-slate-500">:8080</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Edge routing, JWT RBAC validation, W3C TraceContext propagation.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-950/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-blue-400 font-bold">2. INCIDENT SERVICE</span>
                <span className="text-[10px] text-slate-500">:8082</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Transactional Outbox pattern commits local DB + outbox event atomically.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-950/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-purple-400 font-bold">3. KAFKA BACKBONE</span>
                <span className="text-[10px] text-slate-500">:9092</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Event stream with partition key by incident ID. Idempotent consumers.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400 font-bold">4. ASSIGNMENT ENGINE</span>
                <span className="text-[10px] text-slate-500">:8083</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Multi-factor scoring with Redis SETNX distributed mutex lock.
              </p>
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-white/[0.06]">
            
            <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1 font-mono text-xs">
              <div className="flex justify-between text-slate-300">
                <span>AI Service (FastAPI)</span>
                <span className="text-purple-400 font-bold">Safety Override</span>
              </div>
              <span className="text-[10px] text-slate-500">Qdrant Grounded RAG (T=0.0)</span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1 font-mono text-xs">
              <div className="flex justify-between text-slate-300">
                <span>SLA Service</span>
                <span className="text-cyan-400 font-bold">Redis ZSET</span>
              </div>
              <span className="text-[10px] text-slate-500">Non-polling epoch score timers</span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1 font-mono text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Search Service</span>
                <span className="text-amber-400 font-bold">OpenSearch</span>
              </div>
              <span className="text-[10px] text-slate-500">Spatial-temporal dup detector</span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1 font-mono text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Audit Service</span>
                <span className="text-emerald-400 font-bold">SHA-256</span>
              </div>
              <span className="text-[10px] text-slate-500">Cryptographic hash-chain ledger</span>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================
          OBSERVABILITY & SYSTEM TELEMETRY
          ======================================================== */}
      <section id="observability" className="border-t border-white/[0.08] bg-[#07090E] py-20 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
                REAL-TIME TELEMETRY
              </span>
              <h2 className="text-3xl font-black font-mono text-white uppercase mt-1">
                Observability &amp; Metrics
              </h2>
            </div>
            <Link
              href="/system-health"
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <span>VIEW DETAILED SERVICE MESH</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            <div className="p-4 rounded-xl border border-white/[0.08] bg-[#0B0E14] space-y-2">
              <span className="text-[10px] font-mono uppercase text-slate-400">REQUEST RATE</span>
              <div className="text-2xl font-black font-mono text-white">2.4k req/s</div>
              <div className="text-[10px] font-mono text-emerald-400">Spring Cloud Gateway</div>
            </div>

            <div className="p-4 rounded-xl border border-white/[0.08] bg-[#0B0E14] space-y-2">
              <span className="text-[10px] font-mono uppercase text-slate-400">P95 LATENCY</span>
              <div className="text-2xl font-black font-mono text-cyan-400">182ms</div>
              <div className="text-[10px] font-mono text-slate-400">Target &lt; 300ms</div>
            </div>

            <div className="p-4 rounded-xl border border-white/[0.08] bg-[#0B0E14] space-y-2">
              <span className="text-[10px] font-mono uppercase text-slate-400">KAFKA CONSUMER LAG</span>
              <div className="text-2xl font-black font-mono text-emerald-400">12ms</div>
              <div className="text-[10px] font-mono text-slate-400">0 dropped records</div>
            </div>

            <div className="p-4 rounded-xl border border-white/[0.08] bg-[#0B0E14] space-y-2">
              <span className="text-[10px] font-mono uppercase text-slate-400">REDIS HIT RATE</span>
              <div className="text-2xl font-black font-mono text-purple-400">94.8%</div>
              <div className="text-[10px] font-mono text-slate-400">Cache-aside layer</div>
            </div>

            <div className="p-4 rounded-xl border border-white/[0.08] bg-[#0B0E14] space-y-2">
              <span className="text-[10px] font-mono uppercase text-slate-400">AI LATENCY</span>
              <div className="text-2xl font-black font-mono text-amber-400">713ms</div>
              <div className="text-[10px] font-mono text-slate-400">Zero-Shot + RAG</div>
            </div>

          </div>

          {/* Service Matrix Table */}
          <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0B0E14] space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase text-slate-300 tracking-wider">
              CORE MICROSERVICE MESH HEALTH
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {MOCK_SERVICES_HEALTH.slice(0, 8).map((srv) => (
                <div key={srv.name} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-slate-200 font-bold block">{srv.name}</span>
                    <span className="text-[10px] text-slate-500">P95: {srv.p95} // CPU: {srv.cpu}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {srv.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] bg-[#080A0F] py-8 px-6 text-xs font-mono text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto">
        <div>
          VIGIL // ENTERPRISE DISTRIBUTED INCIDENT ORCHESTRATION PLATFORM
        </div>
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="hover:text-slate-300 transition-colors">Command Center</Link>
          <Link href="/incidents" className="hover:text-slate-300 transition-colors">Incident Queue</Link>
          <Link href="/map" className="hover:text-slate-300 transition-colors">Campus Radar</Link>
          <Link href="/system-health" className="hover:text-slate-300 transition-colors">System Health</Link>
        </div>
      </footer>

    </div>
  );
}
