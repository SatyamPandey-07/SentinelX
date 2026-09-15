# SentinelX: Redis Architecture & Keyspace Design

## 1. Keyspace Mapping

| Key Pattern | Data Structure | TTL | Purpose |
|-------------|----------------|-----|---------|
| `lock:responder:{responderId}` | String | 10 seconds | Distributed mutex preventing double-assignment |
| `cache:incident:{incidentId}` | String (JSON) | 10 minutes | Incident aggregate cache-aside |
| `idempotency:incident:{key}` | String (JSON) | 24 hours | Duplicate HTTP POST retry suppression |
| `processed:event:{eventId}` | String | 7 days | Kafka consumer idempotency deduplication |
| `sla:deadlines` | Sorted Set (ZSET) | None (Evicted on Ack) | Scores = epoch ms of breach deadlines |
| `sla:warnings` | Sorted Set (ZSET) | None (Evicted on Ack) | Scores = epoch ms of 80% warning threshold |
| `sla:meta:{incidentId}` | String (JSON) | 2 days | Severity and creation metadata for SLA alerts |
| `auth:failed_attempts:{username}` | String (Integer) | 15 minutes | Account brute-force lockout counter |
| `cache:analytics:overview` | String (JSON) | 60 seconds | P95 latency and compliance summary cache |

---

## 2. Distributed Locking Implementation
```java
// Atomic acquisition with expiration to prevent deadlock on worker crash
Boolean acquired = redisTemplate.opsForValue()
    .setIfAbsent("lock:responder:" + responderId, incidentId, Duration.ofSeconds(10));
```
- If true: Candidate claimed.
- If false: Contention encountered. Next ranked candidate evaluated.

---

## 3. Cache Invalidation
When an incident is acknowledged, resolved, or updated in `IncidentService`, the cache key is explicitly deleted:
`redisTemplate.delete("cache:incident:" + incidentId)`
Subsequent reads repopulate the cache from PostgreSQL.
