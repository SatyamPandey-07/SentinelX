# SentinelX: CAP Theorem & Distributed Systems Theory in Practice

The CAP Theorem (Brewer's Theorem) states that any distributed data store can simultaneously provide at most two of the following three guarantees under network failure:
- **Consistency (C)**: Every read receives the most recent write or an error.
- **Availability (A)**: Every non-failing node returns a non-error response, without guaranteeing it contains the most recent write.
- **Partition Tolerance (P)**: The system continues to operate despite an arbitrary number of messages dropped or delayed by the network between nodes.

In network computing, **Partitions are inevitable** (cables get cut, switches fail, GC pauses cause heartbeats to miss). Therefore, distributed systems must choose between **CP** and **AP** on a per-subsystem basis.

---

## How SentinelX Applies CAP Theorem by Subsystem

SentinelX avoids a naive "one-size-fits-all" approach. Different sub-domains have fundamentally different consistency vs. availability requirements:

```
+-----------------------------------------------------------------------------------------+
|                                    SENTINELX CAP SPECTRUM                               |
+------------------------------------+----------------------------------------------------+
|                CP                  |                         AP                         |
|   (Consistency > Availability)     |            (Availability > Consistency)            |
+------------------------------------+----------------------------------------------------+
| 1. Incident Creation & DB Outbox   | 1. OpenSearch Search Read Projections             |
| 2. Redis Distributed Locking       | 2. Analytics KPIs & Metrics Dashboards             |
| 3. Auth Token Revocation Blacklist | 3. WebSocket Real-Time Broadcast Ticker            |
| 4. Audit Trail Cryptographic Chain | 4. Grounded RAG Knowledge Base Retrieval           |
+------------------------------------+----------------------------------------------------+
```

### 1. CP Subsystems (Consistency Prioritized)

#### A. Incident Creation & Transactional Outbox (PostgreSQL)
- **Tradeoff**: **CP**.
- **Rationale**: An emergency record must be durably and consistently committed to disk before dispatch. If PostgreSQL primary is unreachable, the write fails with HTTP 503 rather than silently dropping or accepting writes on isolated split-brain nodes.
- **Implementation**: Local ACID database transaction atomically commits `incidents` + `outbox_events`.

#### B. Responder Assignment Lock (Redis Distributed Mutex)
- **Tradeoff**: **CP**.
- **Rationale**: Two concurrent incidents must NEVER be assigned to the same responder simultaneously (double assignment). If network partition isolates a Redis node, we prioritize rejecting an ambiguous lock acquisition over allowing two nodes to both claim ownership.
- **Implementation**: Atomic `SETNX` with TTL and unique incident fencing tokens.

#### C. Immutable Audit Ledger (Audit Service)
- **Tradeoff**: **CP**.
- **Rationale**: Cryptographic hash chaining requires strict serialization: `curr_hash = SHA-256(prev_hash + ...)`. An out-of-order write breaks the chain integrity.

---

### 2. AP Subsystems (Availability Prioritized)

#### A. Full-Text Search & Duplicate Detection (OpenSearch)
- **Tradeoff**: **AP**.
- **Rationale**: If OpenSearch is temporarily partitioned or delayed during event consumption, operator queries may return slightly stale search indexes (e.g. lagging by 100ms), but the search endpoint remains available rather than crashing.
- **Fallback**: PostgreSQL remains the source of truth; incident creation never blocks on OpenSearch.

#### B. Analytics KPIs & Response Latency Dashboards
- **Tradeoff**: **AP**.
- **Rationale**: Dashboard operators viewing P95 latency or SLA compliance can safely tolerate 30-second cache lag without compromising live life-safety operations.

#### C. Live STOMP WebSockets
- **Tradeoff**: **AP**.
- **Rationale**: Broadcast notifications are fire-and-forget over WebSocket channels. If a client network connection drops, the client reconnects and polls the authoritative REST API for current state.

---

## Eventual Consistency Guarantees in SentinelX

SentinelX achieves **monotonic-read eventual consistency** across the event backbone:
1. When an incident is persisted in PostgreSQL, the client receives HTTP 201 Created.
2. The Outbox Publisher publishes `incident.created` to Kafka with partition key = `incident_id`.
3. Kafka guarantees total order per partition.
4. Downstream consumers (Search, Analytics, WebSocket, Notification) process events sequentially.
5. In the event of a consumer crash, Kafka consumer group offsets rewind and resume from the last committed offset. Deduplication is handled idempotently via Redis.
