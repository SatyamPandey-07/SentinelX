# SentinelX - Testing Strategy & Verification Guide

## 1. Multi-Tier Testing Philosophy

Emergency response systems require comprehensive verification across multiple failure modes. SentinelX enforces testing across four distinct tiers:
1. **Unit Testing**: Pure isolated business logic (scoring algorithms, SLA timers, deterministic safety regex, JWT validation).
2. **Integration Testing**: Database, cache, and message queue semantics via **Testcontainers** (real PostgreSQL, Redis, and Kafka in ephemeral Docker containers).
3. **Chaos & Resilience Testing**: Injected fault scenarios (broker disconnect, AI crash fallback, consumer crash, duplicate deliveries).
4. **Load & Stress Testing**: High-concurrency traffic emulation with **k6** to measure p95/p99 latency, connection pool saturation, and consumer lag.

---

## 2. Test Execution Commands

```bash
# Run all Java unit tests
mvn test

# Run Java integration tests (requires Docker for Testcontainers)
mvn verify -P integration-test

# Run Python AI service tests (Pytest)
cd services/ai-service
pytest tests/ -v

# Run Chaos Engineering Suite
python scripts/chaos_test.py

# Run k6 Load Test (100, 500, 1000 Virtual Users)
k6 run tests/load/incident_creation_load.js
```

---

## 3. Chaos Engineering Suite (`scripts/chaos_test.py`)

The chaos test script validates real-world distributed failure scenarios:

### Scenario 1: AI Service Outage & Graceful Fallback
- **Fault**: The AI classification service times out or becomes unreachable.
- **Verification**: `IncidentService` does NOT drop or abort the incident. It logs a warning, applies rule-based safety defaults (`HIGH` severity fallback), commits the incident to PostgreSQL and Outbox, and dispatches responders.

### Scenario 2: Kafka Broker Disconnect & Outbox Durability
- **Fault**: The Kafka broker experiences a temporary partition or outage.
- **Verification**: The API request to create an incident succeeds immediately ($< 25\text{ms}$) because the incident and outbox event are persisted atomically in PostgreSQL. Once Kafka recovers, the `OutboxPublisher` drains pending events with zero data loss.

### Scenario 3: At-Least-Once Kafka Delivery & Consumer Idempotency
- **Fault**: Kafka redelivers the exact same `IncidentCreatedEventV1` multiple times due to a rebalance.
- **Verification**: Consumer checks the idempotency state in Redis (`idempotency:event:{eventId}`) or DB unique constraint. Duplicate processing is safely ignored without double-dispatching responders or sending duplicate notifications.

---

## 4. Load Testing Specifications (`tests/load/incident_creation_load.js`)

SentinelX tests performance under three load tiers using k6:
- **Smoke Load**: 100 concurrent virtual users (VUs) for 2 minutes.
- **Stress Load**: 500 concurrent VUs for 5 minutes.
- **Spike Load**: 1,000 concurrent VUs for 2 minutes to simulate sudden disaster reporting.

### Real Performance SLOs
- **Incident Ingestion (REST)**: p95 $< 300\text{ms}$
- **Search Query (OpenSearch)**: p95 $< 200\text{ms}$
- **Responder Assignment**: p95 $< 300\text{ms}$
- **End-to-End WebSocket Dispatch**: $< 500\text{ms}$
