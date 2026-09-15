# SentinelX: Failure Engineering & Degradation Matrix

SentinelX is built around the fundamental reality that distributed components will fail.

---

## Failure Scenario Matrix

| Failure Event | Impact | System Reaction & Recovery Mechanism | Data Loss Risk |
|---------------|--------|---------------------------------------|----------------|
| **Apache Kafka Broker Down** | Asynchronous events cannot be published | Incident creation commits atomically to PostgreSQL via **Transactional Outbox**. OutboxPublisher retries with exponential backoff until Kafka recovers. | **Zero** |
| **Redis Cache Down** | Cache-aside and distributed lock unavailable | Cache reads fall back directly to PostgreSQL. Responder assignment falls back to database transaction isolation or optimistic retries. | **Zero** |
| **PostgreSQL Down** | Primary transactional write unavailable | API Gateway trips Resilience4j circuit breaker and responds with HTTP 503 Service Unavailable. | **Zero** (no corrupt partial writes) |
| **AI Service Down** | NLP classification and RAG unavailable | Deterministic **Rule-Based Safety Guardrails** evaluate raw text. High-hazard incidents auto-escalate; lower-hazard incidents queue for human triage. | **Zero** |
| **OpenSearch Down** | Full-text search degraded | Incident creation is unaffected (PostgreSQL is source of truth). Search queries fall back to internal in-memory replica cache. | **Zero** |
| **Notification Service Down** | Dispatch emails/SMS delayed | Failed events are retried 3 times with exponential backoff, then diverted to `notification.requested.DLQ` for replay. | **Zero** |
| **Duplicate Kafka Delivery** | Redelivered duplicate event | Idempotent consumers check Redis `SETNX processed:event:{id}`. Duplicates are acknowledged and discarded without re-execution. | **Zero** |
| **Responder Assignment Race** | Two incidents claim same responder | **Redis Distributed Mutex** allows only one assignment to acquire lock; the second contender falls back to Candidate #2. | **Zero** |
