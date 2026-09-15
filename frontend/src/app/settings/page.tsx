'use client';

import React from 'react';
import { Settings, Server, Radio, Database, Shield, Activity } from 'lucide-react';

export default function SettingsPage() {
  const services = [
    { name: 'api-gateway', port: 8080, type: 'Spring Cloud Gateway', status: 'HEALTHY' },
    { name: 'auth-service', port: 8081, type: 'Spring Security / JWT', status: 'HEALTHY' },
    { name: 'incident-service', port: 8082, type: 'Transactional Outbox', status: 'HEALTHY' },
    { name: 'assignment-service', port: 8083, type: 'Redis Lock Mutex', status: 'HEALTHY' },
    { name: 'location-service', port: 8084, type: 'PostGIS / gRPC', status: 'HEALTHY' },
    { name: 'sla-service', port: 8085, type: 'Redis ZSet Scheduler', status: 'HEALTHY' },
    { name: 'search-service', port: 8086, type: 'OpenSearch Indexer', status: 'HEALTHY' },
    { name: 'realtime-service', port: 8087, type: 'STOMP WebSockets', status: 'HEALTHY' },
    { name: 'notification-service', port: 8088, type: 'Kafka DLQ Consumer', status: 'HEALTHY' },
    { name: 'analytics-service', port: 8089, type: 'Event Sourced Aggs', status: 'HEALTHY' },
    { name: 'audit-service', port: 8090, type: 'Cryptographic Ledger', status: 'HEALTHY' },
    { name: 'ai-service', port: 8000, type: 'FastAPI / Qdrant RAG', status: 'HEALTHY' },
  ];

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-border">
        <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-hud-cyan" />
          <span>SYSTEM TOPOLOGY &amp; CLUSTER INFRASTRUCTURE</span>
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-0.5">
          SENTINELX DISTRIBUTED RUNTIME ARCHITECTURE // 12 SERVICE NODES
        </p>
      </div>

      {/* Services Grid */}
      <div className="space-y-4">
        <h2 className="text-xs font-mono font-semibold uppercase text-slate-300 flex items-center gap-2">
          <Server className="w-4 h-4 text-blue-400" />
          <span>ACTIVE MICROSERVICE REGISTRY</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {services.map((svc) => (
            <div key={svc.name} className="p-3.5 rounded-xl bg-surface border border-border space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-100">{svc.name}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {svc.status}
                </span>
              </div>
              <div className="text-slate-400 text-[11px]">PORT: {svc.port}</div>
              <div className="text-slate-500 text-[10px]">{svc.type}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Kafka Topics Status */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h2 className="text-xs font-mono font-semibold uppercase text-slate-300 flex items-center gap-2">
          <Radio className="w-4 h-4 text-hud-amber" />
          <span>APACHE KAFKA EVENT BACKBONE TOPICS</span>
        </h2>

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
