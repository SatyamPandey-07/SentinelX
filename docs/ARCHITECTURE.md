# SentinelX Architectural Specification & System Diagrams

SentinelX is an event-driven, resilient distributed emergency response platform. This document specifies the comprehensive system architecture using 12 concrete Mermaid diagrams.

---

## 1. System Architecture Overview

```mermaid
flowchart TB
    subgraph Clients["Perimeter & Client Tier"]
        UI["Next.js Tactical Dashboard"]
        Mobile["Campus Mobile Reporters"]
    end

    subgraph Gateway["API Gateway Tier"]
        GW["Spring Cloud API Gateway (Port 8080)<br/>Rate Limiter | JWT Filter | Trace Injector"]
    end

    subgraph CoreServices["Core Transactional Services"]
        Auth["Auth Service<br/>(JWT / RBAC / Argon2id)"]
        Incident["Incident Service<br/>(Transactional Outbox / PostgreSQL)"]
        Location["Location Service<br/>(PostGIS / gRPC Server)"]
    end

    subgraph EventBackbone["Event Backbone (Apache Kafka)"]
        K_Created["incident.created"]
        K_Classified["incident.classified"]
        K_Assigned["incident.assigned"]
        K_Ack["incident.acknowledged"]
        K_Resolved["incident.resolved"]
        K_Sla["incident.sla.*"]
    end

    subgraph AsyncServices["Event-Driven Processing Services"]
        Assignment["Assignment Service<br/>(Multi-Criteria / Redis Lock)"]
        SLA["SLA Engine Service<br/>(Redis ZSets)"]
        Search["Search Service<br/>(OpenSearch Deduplication)"]
        Realtime["Realtime Service<br/>(STOMP WebSockets)"]
        Notify["Notification Service<br/>(DLQ / Multi-Channel)"]
        Analytics["Analytics Service<br/>(P95 Latency / Redis Cache)"]
        Audit["Audit Service<br/>(Cryptographic Ledger)"]
    end

    subgraph AIService["AI & RAG Subsystem"]
        AI["Python FastAPI Service<br/>(Safety Guardrail + Qdrant RAG)"]
    end

    Clients -->|HTTP / WebSocket| GW
    GW --> Auth
    GW --> Incident
    GW --> Location
    GW --> Search
    GW --> Analytics
    GW --> Audit
    GW --> AI

    Incident -->|Atomic Commit| EventBackbone
    EventBackbone --> Assignment
    EventBackbone --> SLA
    EventBackbone --> Search
    EventBackbone --> Realtime
    EventBackbone --> Notify
    EventBackbone --> Analytics
    EventBackbone --> Audit

    Assignment -.->|gRPC High Speed| Location
    Assignment -->|incident.assigned| EventBackbone
```

---

## 2. Incident Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> REPORTED : User submits incident
    REPORTED --> CLASSIFYING : Event ingested by AI / Safety Guardrail
    CLASSIFYING --> CLASSIFIED : Severity & Category determined
    CLASSIFIED --> ASSIGNED : Nearest responder claimed with Redis Lock
    ASSIGNED --> ACKNOWLEDGED : Responder confirms order (SLA timer stopped)
    ACKNOWLEDGED --> IN_PROGRESS : Unit arrives on scene
    IN_PROGRESS --> RESOLVED : Field incident cleared
    RESOLVED --> CLOSED : Supervisor sign-off
    REPORTED --> CANCELLED : Duplicate detected or false alarm
```

---

## 3. Kafka Event Architecture & Partitioning

```mermaid
flowchart LR
    subgraph Producers
        OutboxPub["Outbox Publisher Worker"]
        AssignSvc["Assignment Service"]
        SlaEngine["SLA Engine"]
    end

    subgraph KafkaTopics["Kafka Topics (Partition Key = incident_id)"]
        T1["incident.created (3 Partitions)"]
        T2["incident.assigned (3 Partitions)"]
        T3["incident.sla.warning (3 Partitions)"]
        T4["incident.sla.breached (3 Partitions)"]
        T5["notification.requested.DLQ"]
    end

    subgraph ConsumerGroups["Independent Consumer Groups"]
        CG1["assignment-service-group"]
        CG2["sla-service-group"]
        CG3["search-service-group"]
        CG4["realtime-service-group"]
        CG5["notification-service-group"]
        CG6["analytics-service-group"]
        CG7["audit-service-group"]
    end

    OutboxPub --> T1
    AssignSvc --> T2
    SlaEngine --> T3
    SlaEngine --> T4

    T1 --> CG1
    T1 --> CG3
    T1 --> CG4
    T1 --> CG5
    T1 --> CG6
    T1 --> CG7

    T2 --> CG2
    T2 --> CG4
    T2 --> CG5

    CG5 -.->|On 3 Failures| T5
```

---

## 4. Database Architecture (Database-Per-Service)

```mermaid
erDiagram
    SENTINELX_AUTH {
        users users
        roles roles
        permissions permissions
        refresh_tokens refresh_tokens
    }

    SENTINELX_INCIDENT {
        incidents incidents
        incident_locations incident_locations
        incident_status_history status_history
        outbox_events outbox_events
    }

    SENTINELX_LOCATION {
        campus_zones campus_zones
        responders responders
    }

    SENTINELX_AUDIT {
        audit_events audit_events
    }

    SENTINELX_ANALYTICS {
        incident_metrics incident_metrics
    }
```

---

## 5. AI Classification Pipeline & Deterministic Safety Override

```mermaid
flowchart TD
    Report["Incident Title & Description"] --> SafetyGuardrail{"Deterministic Safety Guardrail<br/>Regex & Life-Safety Match?"}
    
    SafetyGuardrail -->|Match Found<br/>e.g. Gun / Fire / Cardiac| Override["FORCE ESCALATION<br/>Severity: CRITICAL / HIGH<br/>Confidence: 1.0<br/>Predefined Emergency SOP Actions"]
    
    SafetyGuardrail -->|No Life Threat Match| MLClassifier["NLP Statistical / Heuristic Classifier<br/>Category Keyword Scoring<br/>Confidence Estimation"]
    
    MLClassifier --> Output["Structured JSON Response"]
    Override --> Output
    
    Output --> HumanOverride["Human Dispatcher Console (One-Click Override Enabled)"]
```

---

## 6. Grounded RAG Emergency Procedure Pipeline

```mermaid
flowchart LR
    Query["User / Dispatcher Query"] --> Embed["Vector Frequency Embedding"]
    Embed --> Qdrant["Qdrant Vector DB<br/>Cosine Similarity Search"]
    Qdrant --> Retrieved["Top-K Matching Campus Emergency SOPs"]
    Retrieved --> Synthesis["Grounded RAG Synthesizer"]
    Synthesis --> Output["Guaranteed Factual Response<br/>+ Exact Document & Section Citation<br/>+ Operational Safety Disclaimer"]
```

---

## 7. Deployment Architecture (Kubernetes)

```mermaid
flowchart TB
    Ingress["NGINX Ingress Controller<br/>dispatch.sentinelx.local"] --> GWService["Service: api-gateway:8080"]
    Ingress --> UIService["Service: sentinelx-frontend:3000"]
    
    subgraph K8s_Namespace["Namespace: sentinelx-prod"]
        GWService --> GWPod1["api-gateway pod"]
        GWService --> GWPod2["api-gateway pod"]
        
        GWPod1 --> IncSvc["Service: incident-service:8082"]
        IncSvc --> IncPod1["incident-service pod (HPA scaled)"]
        IncPod1 --> PG["StatefulSet: PostgreSQL 16"]
        IncPod1 --> Redis["StatefulSet: Redis 7"]
        IncPod1 --> Kafka["Cluster: Apache Kafka (KRaft)"]
    end
```

---

## 8. Distributed Tracing Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant GW as API Gateway
    participant Inc as Incident Service
    participant Outbox as Outbox Publisher
    participant Kafka as Apache Kafka
    participant Assign as Assignment Service
    participant Notify as Notification Service

    User->>GW: POST /api/v1/incidents (Generate Trace-ID: 4bf92f35)
    GW->>Inc: Forward with header traceparent: 00-4bf92f35...
    Inc->>Inc: Commit Incident + Outbox (trace_id saved in DB)
    Outbox->>Kafka: Publish incident.created with Kafka header traceparent
    Kafka->>Assign: Consume event (Extract traceparent into MDC)
    Assign->>Kafka: Publish incident.assigned with traceparent
    Kafka->>Notify: Consume event (Extract traceparent into MDC)
    Notify-->>User: Dispatch alert (All spans correlated in Jaeger UI)
```

---

## 9. Failure & Recovery Flow (Outbox & DLQ)

```mermaid
sequenceDiagram
    autonumber
    participant Client
    participant IncSvc as Incident Service
    participant DB as PostgreSQL
    participant Outbox as Outbox Publisher
    participant Kafka as Apache Kafka Broker

    Client->>IncSvc: POST /api/v1/incidents
    IncSvc->>DB: BEGIN TX: INSERT incident + INSERT outbox_event (PENDING)
    DB-->>IncSvc: COMMIT TX
    IncSvc-->>Client: 201 Created (Incident durably saved)
    
    Note over Outbox,Kafka: Kafka Broker Temporarily Down (Outage)
    Outbox->>Kafka: Attempt send (Fails / Times out)
    Outbox->>DB: Increment retry_count = 1, status = PENDING
    
    Note over Kafka: Kafka Broker Recovers
    Outbox->>Kafka: Next poll: send succeeds!
    Outbox->>DB: UPDATE outbox_events SET status = 'PUBLISHED'
```

---

## 10. Authentication & Token Rotation Flow

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant Auth as Auth Service
    participant DB as PostgreSQL
    participant Redis as Redis Cache

    Client->>Auth: POST /login (username, password)
    Auth->>Redis: Check lockout count (auth:failed_attempts)
    Auth->>DB: Verify bcrypt password hash
    Auth->>Auth: Generate JWT Access (15m) + Refresh Token (7d)
    Auth->>DB: INSERT hashed refresh token
    Auth-->>Client: Return Token Pair

    Note over Client,Auth: Access Token Expires (15 min elapsed)
    Client->>Auth: POST /refresh (Refresh Token)
    Auth->>DB: Verify token hash, check not revoked/expired
    Auth->>DB: REVOKE old refresh token (Rotation)
    Auth->>DB: INSERT new refresh token
    Auth-->>Client: Return New Access Token + New Refresh Token
```

---

## 11. Multi-Criteria Assignment Algorithm Flow

```mermaid
flowchart TD
    Event["Consume incident.created"] --> LocationQuery["Query Location Service via gRPC<br/>Find Responders within 5km radius"]
    LocationQuery --> Candidates["Candidate Responder Pool"]
    
    Candidates --> Scoring["Scoring Engine<br/>Score = (DistScore * 0.45) + (SkillScore * 0.35) + (WorkloadScore * 0.20)"]
    Scoring --> Sort["Sort Candidates by Score Descending"]
    
    Sort --> Mutex{"Acquire Redis Lock<br/>SET lock:responder:{id} NX EX 10"}
    Mutex -->|Lock Acquired| Claim["Winner Selected!<br/>Publish incident.assigned to Kafka"]
    Mutex -->|Contention / Locked| NextCandidate["Try Next Highest Ranked Candidate"]
    NextCandidate --> Mutex
```

---

## 12. SLA Engine Architecture (Redis Sorted Sets)

```mermaid
flowchart TD
    Event["Consume incident.assigned"] --> Calc["Compute Ack Deadline<br/>CRITICAL: +2m | HIGH: +5m | MEDIUM: +15m"]
    Calc --> ZSetAdd["Redis ZADD sla:deadlines <deadline_ms> <incident_id><br/>Redis ZADD sla:warnings <80%_ms> <incident_id>"]
    
    subgraph ScheduledWorker["Non-Polling Scheduler (Every 1000ms)"]
        Check["ZRANGEBYSCORE sla:warnings 0 <now_ms><br/>ZRANGEBYSCORE sla:deadlines 0 <now_ms>"]
        Check --> Decision{"Any Timestamps Expired?"}
        Decision -->|Warning Expired| PubWarn["Publish incident.sla.warning<br/>ZREM from sla:warnings"]
        Decision -->|Deadline Expired| PubBreach["Publish incident.sla.breached<br/>ZREM from sla:deadlines"]
    end

    Ack["Consume incident.acknowledged"] --> Cancel["ZREM from sla:deadlines & warnings"]
```
