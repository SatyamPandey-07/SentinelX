# SENTINELX (Distributed Intelligent Emergency & Incident Response Platform)

![SentinelX Architecture](https://img.shields.io/badge/Architecture-Distributed%20Microservices-blue)
![Java](https://img.shields.io/badge/Java-21-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3+-green)
![Kafka](https://img.shields.io/badge/Apache%20Kafka-KRaft-red)
![Redis](https://img.shields.io/badge/Redis-7-red)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-PostGIS-blue)
![OpenSearch](https://img.shields.io/badge/OpenSearch-2.x-teal)
![Qdrant](https://img.shields.io/badge/Qdrant-Vector%20DB-dc244c)
![gRPC](https://img.shields.io/badge/gRPC-Internal%20RPC-4285F4)
![Python](https://img.shields.io/badge/Python-FastAPI-yellow)
![Go](https://img.shields.io/badge/Go-Healthcheck%20CLI-00ADD8)
![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014%20(App%20Router)-black)
![Playwright](https://img.shields.io/badge/Testing-Playwright%20E2E-2EAD33)
![WCAG](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA-purple)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED)
![Kubernetes](https://img.shields.io/badge/Kubernetes-Kustomize-326CE5)
![Observability](https://img.shields.io/badge/Observability-OTel%20%2B%20Prometheus%20%2B%20Grafana%20%2B%20Jaeger-e6522c)
![License](https://img.shields.io/badge/License-MIT-green)

**SentinelX** is an enterprise-grade distributed emergency response and incident management ecosystem engineered for large-scale physical campuses (universities, corporate complexes, and industrial sites). The platform integrates incident ingestion, deterministic AI safety guardrails, spatial-temporal duplicate detection, automated responder dispatch with distributed mutex locking, non-polling Redis SLA deadline tracking, an immutable cryptographic SHA-256 audit ledger, and dual-persona operations (Campus User & Super Admin).

---

## 1. System Architecture

SentinelX enforces a strict **Database-Per-Service** architecture linked by high-throughput **Apache Kafka** event topics, **gRPC** for low-latency spatial and responder lookups, and a **Spring Cloud Gateway** for client routing, JWT validation, and distributed rate limiting.

```
                               ┌──────────────────────────────────────────────┐
                               │   Next.js 14 Operations & User Portal        │
                               │   (Dual-Persona: Campus User & Super Admin)  │
                               └──────────────────────┬───────────────────────┘
                                                      │
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │         Spring Cloud Gateway (:8080)         │
                               │   (Edge Security, Rate Limiting, OTel Trace) │
                               └──────────────────────┬───────────────────────┘
                                                      │
          ┌────────────────────┬──────────────────────┼──────────────────────┬────────────────────┐
          ▼                    ▼                      ▼                      ▼                    ▼
   ┌──────────────┐     ┌──────────────┐       ┌──────────────┐       ┌───────────────┐    ┌──────────────┐
   │ Auth Service │     │Incident Svc  │       │Assignment Svc│       │ Realtime Svc  │    │Search Service│
   │ (:8081)      │     │ (:8082)      │       │ (:8083)      │       │ (:8085)       │    │ (:8086)      │
   └──────┬───────┘     └──────┬───────┘       └──────┬───────┘       └──────┬────────┘    └──────┬───────┘
          │                    │                      │                      │                    │
          └──────────┬─────────┴──────────┬───────────┴──────────┬───────────┴────────────────────┘
                     │                    │                      │
                     ▼                    ▼                      ▼
             ┌───────────────┐    ┌───────────────┐      ┌───────────────┐
             │  PostgreSQL   │    │  Redis 7      │      │ Apache Kafka  │
             │  (PostGIS)    │    │  (Locks, SLA) │      │ (Event Bus)   │
             └───────────────┘    └───────────────┘      └───────┬───────┘
                                                                 │
          ┌────────────────────┬─────────────────────────────────┼────────────────────┐
          ▼                    ▼                                 ▼                    ▼
   ┌──────────────┐     ┌──────────────┐                  ┌──────────────┐     ┌──────────────┐
   │  Audit Svc   │     │Notification  │                  │Analytics Svc │     │   SLA Svc    │
   │ (Hash Chain) │     │ (DLQ/Retry)  │                  │ (P95, MTTR)  │     │ (Redis ZSET) │
   └──────────────┘     └──────┬───────┘                  └──────────────┘     └──────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │   Mailpit    │
                        │ (SMTP :1025) │
                        └──────────────┘
```

---

## 2. Platform Features & Capabilities

### 🛡️ Dual-Persona Emergency Operations
- **Campus User Portal (`/user`)**:
  - **One-Tap SOS Emergency Beacon**: Instantly transmits GPS coordinates, building identifier, and distress telemetry directly to the tactical dispatch queue.
  - **Self-Service Incident Reporting**: Allows students, staff, and faculty to report safety incidents with photos, severity markers, and location pins.
  - **Live Incident Tracking**: Real-time status indicators informing the reporter when units are dispatched, on-scene, or resolving the hazard.
- **Super Admin Tactical Dispatch Center**:
  - **Live Command Overview (`/dashboard`)**: Active incident radar, priority matrix, responder fleet utilization, and SLA compliance metrics.
  - **Incident Queue & Triage (`/incidents`)**: Multi-dimensional filtering by severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), status, and building.
  - **Campus 3D Geospatial Defense Map (`/map`)**: Interactive spatial awareness displaying incident clusters and active responder unit vectors.
  - **Tactical Responder Fleet (`/responders`)**: Telemetry, current dispatch status, battery levels, and equipment profiles.
  - **Redis SLA Deadlines Engine (`/sla`)**: Real-time countdowns, warning states, and automated breach notifications.
  - **Cryptographic Audit Ledger (`/audit`)**: Tamper-evident, hash-chained log of every state transition across the platform.

### 🧠 Grounded AI & Safety Guardrails
- **Deterministic Regex Safety Overrides**: High-consequence hazards (fire, active shooter, chemical spill, cardiac arrest) bypass probabilistic models and force immediate `CRITICAL` escalation with `confidence: 1.0`.
- **Vector-Grounded SOP Retrieval (RAG)**: Integrates **Qdrant Vector DB** and Groq LLM inference to supply grounded, factual Standard Operating Procedures (SOPs) based on verified campus protocols.
- **Spatial-Temporal Duplicate Incident Detection**: OpenSearch BM25 + geospatial radius scoring to detect duplicate reports within a 500m radius and 30-minute window, preventing responder overload.

### ♿ Enterprise-Grade Frontend & Accessibility (WCAG 2.1 AA)
- **Accessible Navigation & Landmarks**: `AppShell` includes accessible skip-to-content links, ARIA landmark regions (`banner`, `main`, `navigation`), and tab navigation.
- **Dynamic Live Alerts**: Screen-reader friendly `aria-live="polite"` and `aria-live="assertive"` notifications for incident status updates and emergency broadcasts.
- **Accessible 404 Recovery (`/not-found`)**: Dedicated, screen-reader compatible error recovery page with direct dashboard return routing.
- **Dual Authentication Modes**:
  - Full **Clerk OAuth & SSO** integration for production campus authentication.
  - Automatic fallback to mock session storage for local development and offline environments.

---

## 3. Microservice Registry

| Service | Technology | Port | Primary Responsibility | Data Store |
|---|---|---|---|---|
| **API Gateway** | Spring Cloud Gateway | 8080 | Edge routing, JWT validation, Redis rate limiting, distributed trace propagation | Ephemeral |
| **Auth Service** | Spring Boot, Spring Security | 8081 | User identity, BCrypt (strength 12), JWT issuance, refresh token rotation | PostgreSQL (`sentinelx_auth`), Redis |
| **Incident Service**| Spring Boot, JPA, Flyway | 8082 | Incident lifecycle, optimistic locking, Transactional Outbox pattern | PostgreSQL (`sentinelx_incident`) |
| **Assignment Service**| Spring Boot, Redisson | 8083 | Multi-factor scoring, Redis `SETNX` distributed mutex lock on responders | Ephemeral (gRPC to Location) |
| **Location Service**| Spring Boot, gRPC | 8084 / 9094 | Geospatial calculations (Haversine/PostGIS), responder GPS tracking | PostgreSQL (`sentinelx_location`) |
| **SLA Service**| Spring Boot, Redis | 8085 | SLA timer evaluation via Redis Sorted Sets (`ZSET`), warning/breach events | Redis (`sla:deadlines`) |
| **Search Service**| Spring Boot, OpenSearch | 8086 | Full-text indexing, spatial-temporal-textual duplicate incident detection | OpenSearch 2.x |
| **Realtime Service**| Spring Boot, STOMP | 8087 | WebSocket push to dispatcher dashboard (`/topic/incidents`, `/topic/sla`) | In-memory Relay |
| **Notification Svc**| Spring Boot, JavaMail | 8088 | Multi-channel alerting (email, SMS, push) with Kafka Dead Letter Queue (DLQ) | Ephemeral / Mailpit |
| **Analytics Svc**| Spring Boot, Redis Cache | 8089 | Real-time calculation of P95, median, MTTA, MTTR, category breakdowns | PostgreSQL (`sentinelx_analytics`), Redis |
| **Audit Service**| Spring Boot, SHA-256 | 8090 | Append-only cryptographically hash-chained audit ledger | PostgreSQL (`sentinelx_audit`) |
| **AI Service**| Python 3.10+, FastAPI | 8000 | Deterministic safety guardrails, ML/LLM classification, Qdrant RAG assistant | Qdrant Vector DB |
| **Web Frontend**| Next.js 14, Tailwind CSS | 3000 | Dual-persona responsive operations portal, campus map, live SLA feeds | Browser Client |
| **Healthcheck CLI**| Go (stdlib only) | — | Automated validator: verifies all 12 microservices and dashboards in parallel | n/a |

---

## 4. Distributed Systems & Reliability Patterns

1. **Transactional Outbox Pattern (`incident-service`)**:
   - Eliminates the dual-write problem by atomically committing incident records and an outbox event within the same database transaction.
   - Background workers poll pending outbox events and publish to Kafka with at-least-once delivery guarantees.
2. **Distributed Mutex Locking (`assignment-service`)**:
   - Solves the race condition where multiple concurrent incidents attempt to claim the same responder simultaneously.
   - Enforces Redis `SETNX` distributed mutex locks (`lock:responder:{id}`) with automatic 10-second TTL renewal.
3. **Non-Polling SLA Timer Engine (`sla-service`)**:
   - Eliminates expensive database polling by storing deadline timestamps as scores in Redis Sorted Sets (`ZSET`).
   - Workers query expired thresholds via `ZRANGEBYSCORE` in $\mathcal{O}(\log N + M)$ time complexity.
4. **Cryptographic Hash-Chained Audit Ledger (`audit-service`)**:
   - Every lifecycle mutation generates an immutable record linked to the previous entry via SHA-256:
     $$H_n = \text{SHA-256}(H_{n-1} \mathbin{\Vert} \text{Payload})$$
   - Any retroactive modification invalidates downstream hashes, ensuring forensic auditability.
5. **Dead Letter Queue (DLQ) & Exponential Backoff (`notification-service`)**:
   - Notification dispatch failures trigger up to 3 retry attempts with exponential backoff before dead-lettering to `notification.requested.DLQ`.
6. **Distributed Rate Limiting (`api-gateway`)**:
   - Token bucket algorithm backed by Redis, keyed per-user (JWT subject) or per-IP to prevent denial-of-service and brute-force attacks across all gateway replicas.

---

## 5. Local Quickstart

### Prerequisites
- Docker Desktop (with WSL2 backend on Windows)
- Node.js 18+ (for frontend)
- Java 21 JDK (optional if running in Docker)
- Python 3.10+ (for local AI development)

> **Detailed walkthrough:** For a step-by-step beginner guide, see [docs/RUNBOOK.md](docs/RUNBOOK.md).

### Step 1: Start Core Infrastructure
```bash
# Clone the repository
git clone https://github.com/SatyamPandey-07/SentinelX.git
cd SentinelX

# Launch all infrastructure (Postgres, Redis, Kafka, OpenSearch, Qdrant, Prometheus, Grafana, Jaeger, Mailpit)
make dev
# Alternatively: docker compose --env-file .env -f infrastructure/docker/docker-compose.yml up -d
```

### Step 2: Access Observability & Infrastructure Consoles
- **Next.js Web Frontend**: `http://localhost:3000`
  - *Campus User Login*: `campus_user` / `User@12345` (navigates to `/user`)
  - *Super Admin Login*: `admin` / `Admin@12345` (navigates to `/dashboard`)
- **API Gateway Actuator**: `http://localhost:8080/actuator/health`
- **Grafana Dashboards**: `http://localhost:3001` (User: `admin` / Pass: `sentinelx`)
- **Jaeger Distributed Tracing**: `http://localhost:16686`
- **Apache Kafka UI**: `http://localhost:8095`
- **OpenSearch Dashboards**: `http://localhost:5601`
- **Prometheus Metrics Console**: `http://localhost:9090`
- **Mailpit Email Sandbox**: `http://localhost:8025`

### Step 3: Run the Frontend
```bash
cd frontend
npm install

# Run in Development mode
npm run dev

# Or build and run blazing-fast Production mode (Recommended for demos)
npm run build
npm run start
```

### Step 4: Verify Platform Health
```bash
cd tools/healthcheck
go run .
```
Validates all 12 services and consoles simultaneously and returns a comprehensive health status table.

---

## 6. Automation Scripts & Demo Assets

SentinelX includes automated tooling for testing, demo recording, and sandbox data population:

| Script | Command | Purpose |
|---|---|---|
| **E2E Flow Test** | `node scripts/test_flow.js` | Automated Playwright test verifying the complete user reporting, SOS beacon, and admin dispatch lifecycle. |
| **Mailpit Alert Seeder** | `node scripts/seed_mailpit.js` | Direct SMTP socket seeder populating realistic critical incident emails, SLA confirmations, and audit notifications. |
| **Master Demo Video Tour** | `node scripts/record_demo.js` | Autonomous Playwright tour capturing dual-persona workflows, Next.js UI, and infrastructure consoles. |
| **4-Minute Project Demo** | `node scripts/record_sentinelx_demo.js` | 16-scene automated demo video generator with continuous 25 FPS compositor heartbeat. |

### 🎬 Pre-Recorded Launch Demos
High-definition demo recordings are pre-rendered and saved in the [`recordings/`](recordings/) directory:
- [`recordings/sentinelx_demo_4min.webm`](recordings/sentinelx_demo_4min.webm) — Full 5-minute comprehensive walkthrough of all 16 scenes and dashboards.
- [`recordings/sentinelx_demo_master.webm`](recordings/sentinelx_demo_master.webm) — Master multi-dashboard showcase with dual-persona authentication.

---

## 7. Verification & Chaos Testing

```bash
# Run unit & integration tests across all microservices
mvn test

# Run Python AI service safety & classification test suite
cd services/ai-service
pytest tests/ -v

# Execute Distributed Chaos Engineering tests (AI outage fallback, Kafka retry, Outbox durability)
python scripts/chaos_test.py

# Run High-Concurrency Load Testing (100 - 1000 Virtual Users via k6)
k6 run tests/load/incident_creation_load.js
```

---

## 8. Complete Documentation Directory

| Document | Description |
|---|---|
| [docs/RUNBOOK.md](docs/RUNBOOK.md) | Step-by-step user and developer runbook with zero assumed background |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 12 complete Mermaid architectural and sequence diagrams |
| [docs/DISTRIBUTED_SYSTEMS.md](docs/DISTRIBUTED_SYSTEMS.md) | Deep-dive into Transactional Outbox, Sagas, Distributed Locks, and CQRS |
| [docs/CAP_THEOREM.md](docs/CAP_THEOREM.md) | Rigorous analysis of CAP theorem trade-offs across microservice boundaries |
| [docs/INTERVIEW_GUIDE.md](docs/INTERVIEW_GUIDE.md) | 26 architectural questions and technical answers for Staff/Principal roles |
| [docs/KAFKA.md](docs/KAFKA.md) | Partition key design, consumer groups, offset commit semantics, and DLQs |
| [docs/REDIS.md](docs/REDIS.md) | Redisson mutex locks, SLA Sorted Sets, cache-aside, and rate limiters |
| [docs/DATABASE.md](docs/DATABASE.md) | Database-per-service isolation, Flyway schema migrations, and PostGIS queries |
| [docs/AI.md](docs/AI.md) | Deterministic safety guardrails, ML/LLM classification, and duplicate detection |
| [docs/RAG.md](docs/RAG.md) | Qdrant vector retrieval, zero-temperature generation, and grounding verification |
| [docs/OBSERVABILITY.md](docs/OBSERVABILITY.md) | OpenTelemetry W3C trace propagation, Prometheus metrics, and structured logs |
| [docs/SECURITY.md](docs/SECURITY.md) | JWT rotation, RBAC role matrix, rate limiting, and secret protection |
| [docs/NETWORKING.md](docs/NETWORKING.md) | HTTP/2 gRPC vs REST, connection pooling, and socket lifecycles |
| [docs/KUBERNETES.md](docs/KUBERNETES.md) | Production K8s manifests, HPA, readiness/liveness probes, and zero-downtime rollouts |
| [docs/FAILURE_HANDLING.md](docs/FAILURE_HANDLING.md) | Graceful degradation matrix for broker, database, and AI outages |
| [docs/TESTING.md](docs/TESTING.md) | Unit, integration, chaos engineering, and k6 load testing execution |
| [docs/CI_CD.md](docs/CI_CD.md) | GitHub Actions CI/CD workflows, quality gates, and container security scanning |
| [docs/OPERATIONS_LINUX.md](docs/OPERATIONS_LINUX.md) | Linux OS internals, JVM memory vs Cgroups, socket states, and CLI diagnostics |
| [docs/adr/](docs/adr/) | 12 Architecture Decision Records (ADR-001 through ADR-012) |
