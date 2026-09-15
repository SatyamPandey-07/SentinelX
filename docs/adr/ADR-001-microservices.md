# ADR-001: Microservices Architecture over Monolith

## Status
Accepted

## Context
SentinelX coordinates campus emergency operations across disparate functional domains: user authentication, incident state progression, AI classification, spatial location queries, SLA deadline monitoring, dispatch notification, and full-text search. A monolithic architecture creates single points of failure, where a spike in search queries or a slow ML classification could block emergency dispatch threads or crash the incident reporting pipeline.

## Decision
Adopt a decoupled microservice architecture where each service owns its domain and database:
1. `api-gateway`: Edge security, routing, and rate limiting.
2. `auth-service`: RBAC and JWT token lifecycle.
3. `incident-service`: Incident domain aggregate and transactional outbox.
4. `ai-service`: Python FastAPI NLP and grounded RAG assistant.
5. `assignment-service`: Multi-criteria responder ranking and distributed locking.
6. `location-service`: Spatial indexing and distance queries via PostGIS and gRPC.
7. `sla-service`: Redis ZSet deadline scheduling.
8. `search-service`: OpenSearch eventual consistency indexer.
9. `realtime-service`: STOMP WebSocket dispatcher.
10. `notification-service`: Multi-channel alerts with DLQ retry handling.
11. `analytics-service`: Response time statistics and compliance aggregation.
12. `audit-service`: Tamper-evident cryptographic ledger.

## Consequences
- **Positive**: Isolated failure domains. High-frequency telemetry or AI processing does not impact the transactional incident pipeline.
- **Positive**: Polyglot stack (Java 21 for high-throughput enterprise events, Python for AI/vector retrieval).
- **Tradeoff**: Distributed operational complexity (addressed with Docker Compose, Kubernetes, and OpenTelemetry distributed tracing).
