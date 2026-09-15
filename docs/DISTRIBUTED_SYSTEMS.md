# SentinelX: Distributed System Patterns Reference

SentinelX implements production-grade distributed systems patterns. Every pattern has a legitimate architectural responsibility.

---

## 1. Transactional Outbox Pattern
- **Problem**: When creating an incident, committing to PostgreSQL and publishing to Apache Kafka cannot be bound in a single distributed transaction without slow and brittle two-phase commits (2PC).
- **Implementation**: The incident row and the outbox event row are inserted atomically in a single local database transaction. A separate scheduled publisher queries pending outbox events and pushes them to Kafka.
- **Failure Scenario**: If Kafka crashes, outbox events accumulate in the database. When Kafka recovers, the publisher drains the queue without losing any records.

---

## 2. Distributed Locking with Fencing Tokens
- **Problem**: If two high-priority incidents arrive simultaneously in the same sector, concurrent assignment workers could score the same responder as the winner and attempt to dispatch them to both scenes (double assignment).
- **Implementation**: The Assignment Service uses Redis atomic `SET lock:responder:{id} {incident_id} NX EX 10`.
- **Tradeoff**: In the event of contention, the worker fails over to the second-highest-ranked responder immediately, ensuring predictable sub-300ms assignment latency.

---

## 3. Idempotent Consumer Pattern
- **Problem**: Kafka guarantees at-least-once delivery. Network glitches, rebalances, or consumer restarts can cause the same message to be redelivered.
- **Implementation**: Consumers maintain deduplication keys in Redis (`processed:event:{eventId}`) with atomic `SETNX` and a 7-day TTL. If an event has already been processed, it is safely acknowledged and discarded.

---

## 4. Cache-Aside Pattern
- **Problem**: Incident queries from hundreds of active dashboard sessions would saturate database connection pools.
- **Implementation**: Incident Service checks Redis first (`cache:incident:{id}`). On a cache miss, it reads from PostgreSQL, writes to Redis with a 10-minute TTL, and returns. Any update or status change evicts the cached key.

---

## 5. Non-Polling SLA Deadline Engine
- **Problem**: Continuously querying a relational table for overdue deadlines (`WHERE deadline < NOW()`) creates index thrashing and lock contention.
- **Implementation**: Redis Sorted Sets (`ZSET`) store incident IDs scored by epoch millisecond deadlines. A background thread checks the range `[0, NOW()]` in $O(\log N + M)$ in-memory time.
