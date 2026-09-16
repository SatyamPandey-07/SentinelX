'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ShieldAlert,
  ArrowRight,
  Layers,
  Clock,
  Zap,
  Compass,
  Lock,
  ChevronRight,
  Shield,
  Bot,
  Terminal,
  Database,
  ChevronDown,
} from 'lucide-react';
import { LandingScene3D } from '@/components/LandingScene3D';
import { SafeSignedIn as SignedIn, SafeSignedOut as SignedOut, SafeUserButton as UserButton } from '@/components/ClerkGate';

const EASE = [0.16, 1, 0.3, 1] as const;

function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.9], [1, 0]);
  const scrollHintOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setActiveStep((prev) => (prev + 1) % 5), 2600);
    return () => clearInterval(interval);
  }, []);

  const pipelineSteps = [
    {
      label: '01 · SIGNAL INGESTION',
      title: 'Geospatial Ingestion',
      detail: 'Incident is written atomically with an outbox event in the same PostgreSQL transaction — no dual-write gap.',
      color: 'text-red-400 border-red-500/40 bg-red-950/30',
    },
    {
      label: '02 · AI TRIAGE',
      title: 'Autonomous Classification',
      detail: 'A safety-guardrailed classifier scores severity; deterministic rules override the model on high-consequence hazards.',
      color: 'text-purple-400 border-purple-500/40 bg-purple-950/30',
    },
    {
      label: '03 · EVENT BACKBONE',
      title: 'Kafka KRaft Streaming',
      detail: 'The outbox publisher relays the event onto Kafka, decoupling every downstream consumer from the write path.',
      color: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/30',
    },
    {
      label: '04 · DISTRIBUTED LOCK',
      title: 'Redis SETNX Consensus',
      detail: 'Responder assignment takes an atomic Redis lock — two dispatchers can never claim the same unit.',
      color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/30',
    },
    {
      label: '05 · DISPATCH',
      title: 'SLA Timer Engine',
      detail: 'Acknowledgement/resolution deadlines land in a Redis sorted set; breaches escalate without polling the database.',
      color: 'text-blue-400 border-blue-500/40 bg-blue-950/30',
    },
  ];

  return (
    <div className="w-full min-h-screen text-[#EDEDED] font-sans antialiased">
      <LandingScene3D />

      {/* ================= NAVBAR ================= */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-12 py-5 transition-colors duration-500 ${
          scrolled ? 'bg-[#060911]/80 backdrop-blur-xl border-b border-white/[0.08]' : 'bg-transparent border-b border-transparent'
        }`}
      >
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center group-hover:border-cyan-300 transition-colors">
            <Shield className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-base font-bold tracking-tight text-white uppercase">
            Sentinel<span className="text-cyan-400">X</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-9 text-xs text-slate-400 uppercase tracking-widest">
          <a href="#pipeline" className="hover:text-white transition-colors">Pipeline</a>
          <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
          <Link href="/map" className="hover:text-white transition-colors">Radar Map</Link>
          <Link href="/system-health" className="hover:text-white transition-colors">System Health</Link>
        </nav>

        <div className="flex items-center gap-2.5">
          <SignedOut>
            <Link
              href="/login?mode=signin"
              id="nav-signin"
              className="hidden md:inline-flex px-5 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 text-xs font-semibold uppercase tracking-widest transition-all border border-white/[0.08]"
            >
              Sign In
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/user"
              className="px-4 py-1.5 rounded-lg bg-cyan-950/50 border border-cyan-500/40 text-cyan-300 text-xs font-bold hover:bg-cyan-900/60 transition-colors"
            >
              My Safety Portal
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity }}
        className="relative min-h-screen flex items-end overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#060911] via-[#060911]/10 to-transparent pointer-events-none" />

        <div className="relative z-10 pointer-events-none w-full max-w-3xl px-6 lg:px-12 pb-20 md:pb-28 pt-32">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-cyan-500/25 text-cyan-300 text-[11px] uppercase tracking-widest mb-6 opacity-0 animate-fade-up"
            style={{ animationDelay: '0.1s' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Distributed defense grid · live
          </div>

          <h1
            className="text-[clamp(2.75rem,8vw,6rem)] font-bold leading-[1.02] tracking-[-0.03em] text-white mb-4 opacity-0 animate-fade-up"
            style={{ animationDelay: '0.22s' }}
          >
            SENTINEL<span className="text-cyan-400">X</span>
          </h1>

          <p
            className="text-white/80 text-[clamp(1.1rem,2.2vw,1.6rem)] font-light mb-4 opacity-0 animate-fade-up"
            style={{ animationDelay: '0.38s' }}
          >
            Emergency response, dispatched at the speed of the network.
          </p>

          <p
            className="text-slate-400 text-[clamp(0.9rem,1.3vw,1.1rem)] font-light leading-relaxed mb-8 max-w-xl opacity-0 animate-fade-up"
            style={{ animationDelay: '0.52s' }}
          >
            A real distributed incident-response platform — Kafka event backbone, Redis-locked
            responder assignment, PostGIS-indexed geospatial routing, and an AI triage layer with
            deterministic safety overrides. Built for campuses and facilities that can&apos;t afford
            a dropped signal.
          </p>

          <div className="flex flex-wrap items-center gap-3 font-semibold opacity-0 animate-fade-up" style={{ animationDelay: '0.66s' }}>
            <Link
              href="/login?mode=signup"
              id="hero-signup-user"
              className="pointer-events-auto px-7 py-3.5 rounded-lg bg-cyan-500 text-[#04070c] text-sm hover:brightness-110 active:scale-[0.97] transition-all flex items-center gap-2"
            >
              Report an Incident
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login?mode=signin&role=admin"
              id="hero-signin-admin"
              className="pointer-events-auto px-7 py-3.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white text-sm border border-white/[0.1] active:scale-[0.97] transition-all flex items-center gap-2"
            >
              <ShieldAlert className="w-4 h-4 text-red-400" />
              Admin Dispatch Console
            </Link>
          </div>

          <p className="text-slate-500 text-xs font-light mt-6 opacity-0 animate-fade-up" style={{ animationDelay: '0.8s' }}>
            11 microservices · PostgreSQL + PostGIS · Kafka · Redis · OpenSearch · real backend, nothing mocked.
          </p>
        </div>

        <motion.div
          style={{ opacity: scrollHintOpacity }}
          className="absolute bottom-8 right-8 hidden md:flex flex-col items-center gap-2 text-slate-500 text-[10px] uppercase tracking-widest pointer-events-none"
        >
          <span className="[writing-mode:vertical-rl]">Scroll</span>
          <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
        </motion.div>
      </motion.section>

      {/* ================= PIPELINE ================= */}
      <section id="pipeline" className="relative py-24 md:py-32 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 text-xs text-purple-400 uppercase tracking-widest mb-3">
              <Zap className="w-3.5 h-3.5" />
              Real-time autonomous pipeline
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              From ingestion to dispatch, traced end to end
            </h2>
            <p className="text-slate-400 text-sm mt-3 font-light">
              Every stage below is a real subsystem in this codebase — click through to see how each one works.
            </p>
          </Reveal>

          <Reveal className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-8" delay={0.1}>
            {pipelineSteps.map((step, idx) => {
              const isActive = activeStep === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`cursor-pointer p-4 rounded-xl border transition-all duration-300 ${
                    isActive ? `${step.color} shadow-lg shadow-black/50 scale-[1.02]` : 'border-white/[0.06] bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="text-[10px] tracking-wider mb-1 font-semibold uppercase">{step.label}</div>
                  <div className="text-sm font-bold text-white mb-2">{step.title}</div>
                  <p className="text-xs text-slate-400 leading-relaxed font-light">{step.detail}</p>
                </div>
              );
            })}
          </Reveal>

          <Reveal delay={0.2}>
            <div className="p-4 rounded-xl bg-slate-950/70 border border-white/[0.08] font-mono text-xs backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 mb-3">
                <div className="flex items-center gap-2 text-slate-400">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>illustrative event trace — topic: incident.created</span>
                </div>
              </div>
              <div className="text-slate-300 space-y-1 text-[11px]">
                <div><span className="text-slate-500">[t+0ms]</span> <span className="text-cyan-400">INGEST:</span> Incident row + outbox_events row committed atomically in Postgres</div>
                <div><span className="text-slate-500">[t+80ms]</span> <span className="text-purple-400">AI_INFER:</span> Category/severity classified, safety rule check applied</div>
                <div><span className="text-slate-500">[t+120ms]</span> <span className="text-emerald-400">LOCK_ACQUIRED:</span> Redis SETNX lock:responder:{'{id}'} ttl=10s SUCCESS</div>
                <div><span className="text-slate-500">[t+180ms]</span> <span className="text-blue-400">DISPATCH:</span> Responder assigned, SLA deadline written to Redis ZSET</div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= ARCHITECTURE BENTO ================= */}
      <section id="architecture" className="relative py-24 md:py-32 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 text-xs text-cyan-400 uppercase tracking-widest mb-3">
              <Layers className="w-3.5 h-3.5" />
              High-assurance architecture
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Engineered for high-stakes operations
            </h2>
            <p className="text-slate-400 text-sm mt-3 font-light">
              Zero-single-point-of-failure patterns across Java 21, Python, and PostGIS.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Reveal className="bento-card group" delay={0.05}>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4 group-hover:border-cyan-400 transition-colors">
                <Compass className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">PostGIS Proximity Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-light">
                Spatial queries indexed for fast campus-boundary lookups, powering responder routing and duplicate-report detection.
              </p>
            </Reveal>

            <Reveal className="bento-card group" delay={0.12}>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-4 group-hover:border-purple-400 transition-colors">
                <Bot className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">AI Triage + RAG</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-light">
                A FastAPI classification service, backed by a vector-grounded assistant, with deterministic safety rules that always win.
              </p>
            </Reveal>

            <Reveal className="bento-card group" delay={0.19}>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 group-hover:border-emerald-400 transition-colors">
                <Lock className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Redis SETNX Locks</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-light">
                Atomic distributed locking prevents two dispatchers from ever claiming the same responder at once.
              </p>
            </Reveal>

            <Reveal className="bento-card md:col-span-2 group" delay={0.08}>
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4 group-hover:border-red-400 transition-colors">
                <Database className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Hash-Chained Audit Ledger</h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xl mb-4 font-light">
                Every status transition and acknowledgement is written into an append-only ledger, chained via SHA-256 for tamper evidence.
              </p>
              <Link href="/audit" className="text-red-400 hover:text-red-300 flex items-center gap-1 text-xs font-bold">
                View audit logs <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </Reveal>

            <Reveal className="bento-card group" delay={0.15}>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 group-hover:border-amber-400 transition-colors">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">SLA Timer Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-light mb-4">
                Deadlines tracked in a Redis sorted set and swept for breaches — no database polling loop.
              </p>
              <Link href="/sla" className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-xs font-bold">
                Monitor SLA <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="relative py-12 border-t border-white/[0.08] text-slate-500 text-xs px-6 lg:px-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <span className="text-slate-300 font-semibold tracking-wide">SentinelX</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <Link href="/dashboard" className="hover:text-cyan-400 transition-colors">Dashboard</Link>
            <Link href="/map" className="hover:text-cyan-400 transition-colors">Radar Map</Link>
            <Link href="/incidents" className="hover:text-cyan-400 transition-colors">Incidents</Link>
            <Link href="/intelligence" className="hover:text-cyan-400 transition-colors">AI Intelligence</Link>
            <Link href="/system-health" className="hover:text-cyan-400 transition-colors">System Health</Link>
          </div>

          <div className="text-slate-600">© 2026 SentinelX · Distributed Systems</div>
        </div>
      </footer>
    </div>
  );
}
