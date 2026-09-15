# SentinelX - Observability, Distributed Tracing & Metrics

## 1. Observability Philosophy

In a high-stakes incident response platform, downtime or silent data loss can result in unhandled emergencies. Distributed observability provides:
- **Traceability**: Following a single incident from API Gateway -> Incident Service -> Kafka -> AI Service -> Assignment Service -> WebSocket broadcast with a single `trace_id`.
- **Proactive Alerting**: Detecting Kafka consumer lag, dead-letter queue spillover, and SLA breach rates before they escalate.
- **Root Cause Isolation**: Instant correlation between a database connection pool exhaustion in `incident-service` and a spike in p99 response times on `/api/v1/incidents`.

---

## 2. Distributed Tracing Architecture (OpenTelemetry + Jaeger)

SentinelX instruments all Java services using the **OpenTelemetry Java Agent** and OpenTelemetry SDK with W3C Trace Context propagation (`traceparent` header).

```
 Client Request (X-Correlation-ID: 9a7b...)
        │
        ▼
 ┌──────────────────────┐  trace_id: 4bf92f3577b34da6a3ce929d0e0e4736
 │ API Gateway          │  span_id:  00f067aa0ba902b7
 └──────────┬───────────┘
            │ HTTP (traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-...)
            ▼
 ┌──────────────────────┐  span_id:  5fb397be34d23b0f
 │ Incident Service     │  parent:   00f067aa0ba902b7
 └──────────┬───────────┘
            │ Kafka Record Headers (traceparent injected)
            ▼
 ┌──────────────────────┐  span_id:  321045baf90123ef
 │ Assignment Consumer  │  parent:   5fb397be34d23b0f
 └──────────┬───────────┘
            │ gRPC Metadata (traceparent propagated)
            ▼
 ┌──────────────────────┐  span_id:  8829471abefc3011
 │ Location Service     │  parent:   321045baf90123ef
 └──────────────────────┘
```

Traces are exported over OTLP/gRPC to the OpenTelemetry Collector on port `4317` and visualized in Jaeger (`http://localhost:16686`).

---

## 3. Metrics Collection (Prometheus + Micrometer)

Every Spring Boot microservice exposes Prometheus metrics via Spring Boot Actuator at `/actuator/prometheus`.

### Key Metrics Monitored

| Metric Name | Type | Description | Target Alert Threshold |
|---|---|---|---|
| `http_server_requests_seconds` | Histogram | Request latency across all REST endpoints | p95 > 300ms |
| `kafka_consumer_records_lag` | Gauge | Unprocessed records in Kafka consumer partitions | Lag > 50 messages |
| `hikaricp_connections_active` | Gauge | Active database connections in Hikari pool | > 80% pool capacity |
| `sentinelx_sla_breach_total` | Counter | Total incidents that breached SLA deadline | > 0 in 15min window |
| `sentinelx_redis_lock_failures_total` | Counter | Failed attempts to acquire Redis distributed lock | > 5/minute |
| `jvm_memory_used_bytes` | Gauge | JVM Heap memory utilization | > 85% of Max Heap |

Prometheus scrapes targets every 15 seconds. Grafana pre-provisions dashboards at `http://localhost:3000` (credentials: `admin/admin`).

---

## 4. Structured JSON Logging

Logs are formatted in single-line structured JSON (via Logback / Logstash Logback Encoder) to enable ingestion by OpenSearch, Loki, or Datadog without custom regex grok patterns.

Example log output:
```json
{
  "@timestamp": "2026-09-15T10:14:32.418Z",
  "level": "INFO",
  "logger": "com.sentinelx.incident.service.IncidentService",
  "message": "Incident created and committed to outbox",
  "service": "incident-service",
  "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
  "span_id": "5fb397be34d23b0f",
  "incident_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "severity": "CRITICAL",
  "user_id": "8d39f41a-9923-42b1-bce0-d326f5546e81"
}
```

### Security Log Sanitization
Structured log encoders enforce sanitization filters:
- Passwords, bearer tokens, credit card patterns, and SSNs are automatically redacted (`[REDACTED]`).
- Environment secrets are never printed in application startup logs.
