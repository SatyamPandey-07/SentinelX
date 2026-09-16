'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Settings, Server, Radio, Loader2 } from 'lucide-react';
import { probeServiceHealth, SERVICE_PORTS } from '@/lib/api';

const SERVICE_META: Record<string, string> = {
  'api-gateway': 'Spring Cloud Gateway',
  'auth-service': 'Spring Security / JWT',
  'incident-service': 'Transactional Outbox',
  'assignment-service': 'Redis Lock Mutex',
  'location-service': 'PostGIS / gRPC',
  'sla-service': 'Redis ZSet Scheduler',
  'search-service': 'OpenSearch Indexer',
  'realtime-service': 'STOMP WebSockets',
  'notification-service': 'Kafka DLQ Consumer',
  'analytics-service': 'Event Sourced Aggs',
  'audit-service': 'Cryptographic Ledger',
  'ai-service': 'FastAPI / Qdrant RAG',
};

// Topic layout is deploy-time Kafka configuration (see docker-compose /
// service application.yml), not runtime state -- there's no "list topics"
// endpoint exposed to the frontend, so this stays a static reference
// rather than pretending to poll something that doesn't exist.
const kafkaTopics = [
  { name: 'incident.created', partitions: 3, retention: '7 Days' },
  { name: 'incident.classified', partitions: 3, retention: '7 Days' },
  { name: 'incident.assigned', partitions: 3, retention: '7 Days' },
  { name: 'incident.acknowledged', partitions: 3, retention: '7 Days' },
  { name: 'incident.resolved', partitions: 3, retention: '7 Days' },
  { name: 'incident.sla.warning', partitions: 3, retention: '3 Days' },
  { name: 'incident.sla.breached', partitions: 3, retention: '7 Days' },
  { name: 'notification.requested', partitions: 3, retention: '3 Days' },
];

interface ProbeResult {
  service: string;
  up: boolean;
  latencyMs: number | null;
}

export default function SettingsPage() {
  const [results, setResults] = useState<ProbeResult[]>([]);
  const [loading, setLoading] = useState(true);

  const probeAll = useCallback(async () => {
    const names = Object.keys(SERVICE_PORTS);
    const out = await Promise.all(names.map((name) => probeServiceHealth(name)));
    setResults(out);
    setLoading(false);
  }, []);

  useEffect(() => {
    probeAll();
    const poll = setInterval(probeAll, 10000);
    return () => clearInterval(poll);
  }, [probeAll]);

  const byService = new Map(results.map((r) => [r.service, r]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-border">
        <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-hud-cyan" />
          <span>SYSTEM TOPOLOGY &amp; CLUSTER INFRASTRUCTURE</span>
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-0.5">
          SENTINELX DISTRIBUTED RUNTIME ARCHITECTURE // 12 SERVICE NODES · status probed live, same as System Health
        </p>
      </div>

      {/* Services Grid */}
      <div className="space-y-4">
        <h2 className="text-xs font-mono font-semibold uppercase text-slate-300 flex items-center gap-2">
          <Server className="w-4 h-4 text-blue-400" />
          <span>ACTIVE MICROSERVICE REGISTRY</span>
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-slate-400 font-mono text-sm gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            PROBING SERVICES...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(SERVICE_PORTS).map(([name, port]) => {
              const probe = byService.get(name);
              const up = probe?.up ?? false;
              return (
                <div key={name} className="p-3.5 rounded-xl bg-surface border border-border space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100">{name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                      up ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}>
                      {up ? 'HEALTHY' : 'UNREACHABLE'}
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px]">PORT: {port}</div>
                  <div className="text-slate-500 text-[10px]">{SERVICE_META[name] ?? ''}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Kafka Topics (static deploy-time configuration) */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h2 className="text-xs font-mono font-semibold uppercase text-slate-300 flex items-center gap-2">
          <Radio className="w-4 h-4 text-hud-amber" />
          <span>APACHE KAFKA EVENT BACKBONE TOPICS</span>
        </h2>
        <p className="text-[10px] text-slate-500 font-mono -mt-2">
          Deploy-time topic configuration — no browser-facing endpoint exists to poll live partition state.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {kafkaTopics.map((topic) => (
            <div key={topic.name} className="p-3 rounded-lg bg-surface border border-border text-xs font-mono space-y-1">
              <div className="text-slate-200 font-semibold truncate">{topic.name}</div>
              <div className="text-[10px] text-slate-400">PARTITIONS: {topic.partitions} // {topic.retention}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
