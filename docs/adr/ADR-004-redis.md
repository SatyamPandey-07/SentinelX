# ADR-004: Redis for Distributed Locking, Caching & SLA Scheduling

## Status
Accepted

## Context
1. **Concurrency Race Condition**: If two high-priority incidents occur simultaneously in the same sector, concurrent assignment workers could assign the exact same responder to both incidents (double-assignment).
2. **SLA Monitoring**: Continuously polling PostgreSQL with `SELECT ... WHERE deadline < NOW()` degrades primary write throughput.
3. **Read Throughput**: Frequent incident queries and operational analytics dashboards hammer relational tables.

## Decision
Adopt Redis 7 for distinct distributed responsibilities:
1. **Distributed Mutex**: Atomic `SETNX` with TTL (`lock:responder:{id}`) to ensure only one incident claims a responder at any time.
2. **Non-Polling SLA Scheduling**: Redis Sorted Sets (`ZSET`) where scores represent unix epoch milliseconds of breach deadlines (`ZRANGEBYSCORE`). Checks execute in $O(\log N + M)$ without disk I/O.
3. **Cache-Aside Pattern**: Frequently accessed incidents cached with 10-minute TTL and invalidation on state changes.
4. **Idempotency Store**: Caches `Idempotency-Key` headers for 24 hours to deduplicate client retries.

## Consequences
- **Positive**: Eliminates responder race conditions and protects PostgreSQL from polling contention.
- **Tradeoff**: In-memory ephemeral nature requires cache-aside design where PostgreSQL remains the definitive source of truth.
