# SENTINELX (Distributed Intelligent Emergency & Incident Response Platform)

![SentinelX Architecture](https://img.shields.io/badge/Architecture-Distributed%20Microservices-blue)
![Java](https://img.shields.io/badge/Java-21-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3+-green)
![Kafka](https://img.shields.io/badge/Apache%20Kafka-KRaft-red)
![Redis](https://img.shields.io/badge/Redis-7-red)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-PostGIS-blue)
![OpenSearch](https://img.shields.io/badge/OpenSearch-2.x-teal)
![Python](https://img.shields.io/badge/Python-FastAPI-yellow)
![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black)
![License](https://img.shields.io/badge/License-MIT-green)

SentinelX is a production-grade distributed emergency and incident management platform built for large campuses (universities, corporate complexes, and industrial sites). The system coordinates incident ingestion, AI hazard classification with deterministic safety guardrails, spatial-temporal duplicate detection, intelligent responder dispatch with distributed locking, real-time SLA tracking via Redis sorted sets, and an immutable cryptographic audit ledger.

-----

## 1. System Architecture

SentinelX adopts a **Database-Per-Service** microservices architecture connected by a high-throughput **Apache Kafka** event backbone, **gRPC** for low-latency internal queries, and **Spring Cloud Gateway** for client routing and edge security.

```
                               ┌─────────────────────────┐
                               │ Next.js Web Application │
                               └────────────┬────────────┘
                                            │
                                            ▼
                               ┌─────────────────────────┐
                               │   Spring Cloud Gateway  │
                               │   (:8080 - JWT & Trace) │
                               └────────────┬────────────┘
                                            │
         ┌───────────────────┬──────────────┼────────────────────┬───────────────────┐
         ▼                   ▼              ▼                    ▼                   ▼
  ┌──────────────┐   ┌──────────────┐ ┌──────────────┐   ┌───────────────┐   ┌──────────────┐
  │ Auth Service │   │Incident Svc  │ │Assignment Svc│   │ Realtime Svc  │   │Search Service│
  │ (:8081)      │   │ (:8082)      │ │ (:8083)      │   │ (:8085)       │   │ (:8086)      │
  └──────┬───────┘   └──────┬───────┘ └──────┬───────┘   └──────┬────────┘   └──────┬───────┘
         │                  │                │                  │                   │
         └────────┬─────────┴────────┬───────┴──────────┬───────┴───────────────────┘
                  │                  │                  │
                  ▼                  ▼                  ▼
          ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
          │  PostgreSQL   │  │  Redis 7      │  │ Apache Kafka  │
          │  (PostGIS)    │  │  (Locks, SLA) │  │ (Event Bus)   │
          └───────────────┘  └───────────────┘  └───────┬───────┘
                                                        │
         ┌───────────────────┬──────────────────────────┼───────────────────┐
         ▼                   ▼                          ▼                   ▼
  ┌──────────────┐   ┌──────────────┐           ┌──────────────┐    ┌──────────────┐
  │  Audit Svc   │   │Notification  │           │Analytics Svc │    │   SLA Svc    │
  │ (Hash Chain) │   │ (DLQ/Retry)  │           │ (P95, MTTR)  │    │ (Redis ZSET) │
  └──────────────┘   └──────────────┘           └──────────────┘    └──────────────┘
```

---

## 2. Microservice Registry

| Service | Technology | Port | Primary Responsibility | Data Store |
|---|---|---|---|---|
| **API Gateway** | Spring Cloud Gateway | 8080 | Edge routing, JWT validation, rate limiting, distributed trace propagation | Ephemeral |
| **Auth Service** | Spring Boot, Spring Security | 8081 | User identity, BCrypt (strength 12), JWT issuance, refresh token rotation | PostgreSQL (`sentinelx_auth`), Redis |
| **Incident Service**| Spring Boot, JPA, Flyway | 8082 | Incident lifecycle, optimistic locking, Transactional Outbox pattern | PostgreSQL (`sentinelx_incident`) |
| **Assignment Service**| Spring Boot, Redisson | 8083 | Multi-factor scoring, Redis `SETNX` distributed mutex lock on responders | Ephemeral (gRPC to Location) |
| **Location Service**| Spring Boot, gRPC | 8084 / 9094 | Geospatial calculations (Haversine/PostGIS), responder GPS tracking | PostgreSQL (`sentinelx_location`) |
| **Realtime Service**| Spring Boot, STOMP | 8085 | WebSocket push to dispatcher dashboard (`/topic/incidents`, `/topic/sla`) | In-memory Relay |
| **Search Service**| Spring Boot, OpenSearch | 8086 | Full-text indexing, spatial-temporal-textual duplicate incident detection | OpenSearch 2.x |
| **SLA Service**| Spring Boot, Redis | 8087 | SLA timer evaluation via Redis Sorted Sets (`ZSET`), warning/breach events | Redis (`sla:deadlines`) |
| **Notification Svc**| Spring Boot, JavaMail | 8088 | Multi-channel alerting (email, SMS, push) with Kafka Dead Letter Queue (DLQ) | Ephemeral / MailHog |
| **Analytics Svc**| Spring Boot, Redis Cache | 8089 | Real-time calculation of P95, median, MTTA, MTTR, category breakdowns | PostgreSQL (`sentinelx_analytics`), Redis |
| **Audit Service**| Spring Boot, SHA-256 | 8090 | Append-only cryptographically hash-chained audit ledger | PostgreSQL (`sentinelx_audit`) |
| **AI Service**| Python 3.10+, FastAPI | 8000 | Deterministic safety guardrails, ML/LLM classification, Qdrant RAG assistant | Qdrant Vector DB |
| **Web Frontend**| Next.js 14, Tailwind CSS | 3000 | Responsive dispatcher operations portal, campus map, live SLA feeds | Browser Client |

---

## 3. Core Distributed Systems Patterns

1. **Transactional Outbox Pattern (`IncidentService`)**:
   - Eliminates the dual-write problem by atomically writing the incident record and an outbox event in the same local database transaction.
   - An asynchronous worker (`OutboxPublisher`) reads pending outbox events and publishes them to Kafka with retry tracking.
2. **Distributed Mutex Locking (`AssignmentService`)**:
   - Solves the race condition where concurrent incidents attempt to assign the same optimal responder simultaneously.
   - Uses Redis `SETNX` distributed locks (`lock:responder:{id}`) with a 10-second TTL to guarantee single-dispatch semantics.
3. **Deterministic AI Safety Guardrails (`ai-service`)**:
   - Machine learning inference is strictly subordinate to deterministic regex safety rules. High-consequence hazards (fire, active shooter, cardiac arrest, hazardous chemical leaks) trigger instant `CRITICAL` severity overrides with `confidence: 1.0`.
4. **Non-Polling SLA Timer Engine (`sla-service`)**:
   - Rather than continuously hammering relational databases, SLA deadlines are stored as UNIX epoch scores in Redis Sorted Sets (`ZSET`). Scheduled workers query expired elements via `ZRANGEBYSCORE` in $\mathcal{O}(\log N + M)$ time.
5. **Cryptographic Hash-Chained Audit Ledger (`audit-service`)**:
   - Every state transition generates an audit entry linked to the previous entry via SHA-256 hash chaining ($H_n = \text{SHA256}(H_{n-1} + \text{Payload})$), guaranteeing tamper evidence.
6. **Kafka At-Least-Once Delivery & Idempotent Consumers**:
   - Every consumer verifies event IDs in Redis or database unique constraint tables before processing, safely ignoring redeliveries.
7. **Dead Letter Queue (DLQ) & Exponential Backoff (`notification-service`)**:
   - Failed notifications retry up to 3 times with exponential backoff before routing to `notification.requested.DLQ` for administrator investigation.

---

## 4. Local Quickstart (Zero-to-Running)

### Prerequisites
- Docker & Docker Compose (or Docker Desktop)
- Java 21 JDK (optional if running inside containers)
- Node.js 18+ (for local frontend development)
- Python 3.10+ (for local AI development)

### Step 1: Start Core Infrastructure
```bash
# Clone the repository
git clone https://github.com/your-org/sentinelx.git
cd sentinelx

# Launch all infrastructure (PostgreSQL, Redis, Kafka, OpenSearch, Qdrant, Prometheus, Grafana, Jaeger)
make dev
# Alternatively: docker compose -f infrastructure/docker/docker-compose.yml up -d
```

### Step 2: Access Infrastructure Consoles
- **Kafka-UI**: `http://localhost:8080` (or `http://localhost:8085` depending on port bindings)
- **OpenSearch Dashboards**: `http://localhost:5601`
- **Prometheus UI**: `http://localhost:9090`
- **Grafana Dashboards**: `http://localhost:3000` (User: `admin` / Pass: `admin`)
- **Jaeger Tracing**: `http://localhost:16686`
- **MailHog Inbox**: `http://localhost:8025`

### Step 3: Run the Services
```bash
# Compile and package all Java microservices
mvn clean package -DskipTests

# Start the Frontend
cd frontend
npm install
npm run dev
# Accessible at http://localhost:3000
```

---

## 5. Verification & Testing

```bash
# Run unit tests across all microservices
mvn test

# Run Python AI service safety and classification tests
cd services/ai-service
pytest tests/ -v

# Run Distributed Systems Chaos Tests (AI outage fallback, Kafka redelivery, Outbox durability)
python scripts/chaos_test.py

# Run High-Concurrency Load Test (100, 500, 1000 VUs via k6)
k6 run tests/load/incident_creation_load.js
```

---

## 6. Project Documentation Index

| Document | Description |
|---|---|
| [docs/ARCHITECTURE.md](file:///d:/VIGIL/docs/ARCHITECTURE.md) | 12 complete Mermaid diagrams detailing workflows, data flows, and lifecycles |
| [docs/DISTRIBUTED_SYSTEMS.md](file:///d:/VIGIL/docs/DISTRIBUTED_SYSTEMS.md) | In-depth breakdown of Transactional Outbox, Sagas, Distributed Locks, and CQRS |
| [docs/CAP_THEOREM.md](file:///d:/VIGIL/docs/CAP_THEOREM.md) | Rigorous analysis of CAP theorem trade-offs across SentinelX services |
| [docs/INTERVIEW_GUIDE.md](file:///d:/VIGIL/docs/INTERVIEW_GUIDE.md) | 26 comprehensive interview questions and technical answers for Staff/Principal roles |
| [docs/KAFKA.md](file:///d:/VIGIL/docs/KAFKA.md) | Partition key design, consumer groups, offset management, and DLQ semantics |
| [docs/REDIS.md](file:///d:/VIGIL/docs/REDIS.md) | Distributed mutex locking, SLA Sorted Sets, cache-aside, and rate limiting |
| [docs/DATABASE.md](file:///d:/VIGIL/docs/DATABASE.md) | Database-per-service isolation, Flyway migrations, and geospatial indexing |
| [docs/AI.md](file:///d:/VIGIL/docs/AI.md) | Deterministic safety guardrails, ML/LLM strategies, and duplicate scoring |
| [docs/RAG.md](file:///d:/VIGIL/docs/RAG.md) | Qdrant vector retrieval, zero-temperature generation, and grounding verification |
| [docs/OBSERVABILITY.md](file:///d:/VIGIL/docs/OBSERVABILITY.md) | OpenTelemetry W3C trace propagation, Prometheus metrics, and structured JSON logs |
| [docs/SECURITY.md](file:///d:/VIGIL/docs/SECURITY.md) | JWT rotation, RBAC role matrix, rate limiting, and secret protection |
| [docs/NETWORKING.md](file:///d:/VIGIL/docs/NETWORKING.md) | HTTP/2 gRPC vs REST, connection pooling, and socket lifecycle |
| [docs/KUBERNETES.md](file:///d:/VIGIL/docs/KUBERNETES.md) | Production K8s manifests, HPA, readiness/liveness probes, and zero-downtime rollouts |
| [docs/FAILURE_HANDLING.md](file:///d:/VIGIL/docs/FAILURE_HANDLING.md) | Graceful degradation matrix for broker, database, and AI outages |
| [docs/TESTING.md](file:///d:/VIGIL/docs/TESTING.md) | Unit, integration, chaos engineering, and k6 load testing execution |
| [docs/CI_CD.md](file:///d:/VIGIL/docs/CI_CD.md) | GitHub Actions CI/CD workflows, quality gates, and container security scanning |
| [docs/OPERATIONS_LINUX.md](file:///d:/VIGIL/docs/OPERATIONS_LINUX.md) | Linux OS internals, JVM memory vs Cgroups, socket states, and CLI diagnostics |
| [docs/adr/](file:///d:/VIGIL/docs/adr) | 12 Architecture Decision Records (ADR-001 through ADR-012) |
