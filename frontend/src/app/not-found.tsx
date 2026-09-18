import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 mb-6">
        <ShieldAlert className="w-8 h-8" aria-hidden="true" />
      </div>
      <h1 className="text-4xl font-bold font-mono tracking-tight text-white mb-2">
        404: SECTOR NOT FOUND
      </h1>
      <p className="text-sm font-mono text-slate-400 max-w-md mb-8">
        The tactical vector or coordinate you requested does not exist in the SentinelX operational grid.
      </p>
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          aria-label="Return to Command Center"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold transition-colors shadow-lg shadow-cyan-950/50"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Return to Command Center</span>
        </Link>
        <Link
          href="/"
          aria-label="Return to Landing Page"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 text-slate-300 hover:text-white font-mono text-xs font-medium transition-colors"
        >
          <span>Landing Page</span>
        </Link>
      </div>
    </div>
  );
}
