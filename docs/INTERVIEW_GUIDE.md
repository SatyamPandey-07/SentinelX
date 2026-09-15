# SentinelX: Comprehensive Staff/Principal Distributed Systems Interview Guide

This guide details the architectural decisions, failure scenarios, concurrency guarantees, and trade-offs engineered into SentinelX.

---

### Q1: Why Kafka instead of REST for inter-service communication?
**Answer**:
Direct REST communication creates tight runtime coupling and cascading failure chains. If the Assignment, Notification, or Audit service experiences latency or a temporary restart, a REST-based incident creation endpoint would either block threads or fail the request.
Kafka provides:
1. **Temporal Decoupling**: Producers publish events without requiring consumers to be online.
2. **Backpressure Buffering**: High-volume emergency bursts are queued in partitions; consumers process at their own sustainable rate without crashing.
3. **Multi-Consumer Fan-Out**: A single `incident.created` event is consumed by Assignment, SLA, Search, Notification, and Audit services independently with separate consumer group offsets.
4. **Replayability**: If a bug is fixed in the Analytics service, we can rewind consumer offsets and reprocess historical events.

---

### Q2: Why both PostgreSQL and OpenSearch? Why not just one?
**Answer**:
No single database excels at both ACID transactional integrity and multi-dimensional full-text spatial search:
- **PostgreSQL**: System of record. Provides ACID transactions, serializable isolation, optimistic locking, foreign keys, and atomic Transactional Outbox commits.
- **OpenSearch**: Secondary read projection. Provides inverted indexes for tokenized Lucene text search and compound geo-distance queries.
If we used only OpenSearch, we would forfeit transactional outbox guarantees and ACID durability. If we used only PostgreSQL, full-text `LIKE '%token%'` and spatial radius queries across millions of rows would degrade transactional write throughput.

---

### Q3: Why Redis? What are its concrete responsibilities?
**Answer**:
Redis handles 4 critical distributed requirements:
1. **Distributed Mutex Lock**: Prevents double-assignment race conditions when assigning responders to concurrent incidents (`SETNX` with TTL).
2. **Non-Polling SLA Scheduling**: Sorted Sets (`ZSET`) where scores represent epoch millisecond deadlines. Avoids periodic database table polling.
3. **Cache-Aside Read Acceleration**: Caches frequently queried incident aggregates with 10-minute TTL and invalidation on updates.
4. **Idempotency Store**: Deduplicates client retries using `Idempotency-Key` headers stored with 24-hour TTL.

---

### Q4: What happens if Kafka goes down?
**Answer**:
Zero emergency incident data is lost.
Because SentinelX implements the **Transactional Outbox Pattern**, the user's incident report is committed to PostgreSQL along with an `outbox_events` record in the exact same local database transaction.
The `OutboxPublisher` worker detects Kafka connection failures, logs a warning, and retains the events in `PENDING` state. As soon as the Kafka broker recovers, the background publisher drains the backlog and publishes all events in chronological order.

---

### Q5: What happens if the AI service goes down?
**Answer**:
The incident creation pipeline does NOT halt.
SentinelX implements deterministic rule-based safety fallback:
1. If the AI service is unreachable, the system evaluates regex safety guardrails (e.g. fire, weapons, unconsciousness, chemical leaks).
2. If safety keywords match, the incident is automatically escalated to `CRITICAL` or `HIGH` with predefined SOP actions.
3. If no high-hazard keywords match, the incident is flagged with default category/severity and queued for human operator triage.

---

### Q6: How do you prevent duplicate incidents?
**Answer**:
SentinelX prevents duplicates at two distinct layers:
1. **Network/Client Retries (Idempotency Key)**: If a client loses connection and retries the HTTP POST, the `Idempotency-Key` header checks Redis. If the key exists, the cached HTTP 201 response is returned immediately without inserting a new database record.
2. **Physical Duplicate Detection (OpenSearch)**: If multiple bystanders report the same emergency (e.g. "smoke in chem lab"), the Search Service evaluates a composite spatial-temporal-textual query:
   - Category equality (`FIRE == FIRE`)
   - Geographic distance $\le 150\text{ meters}$
   - Time window $\le 10\text{ minutes}$
   - Jaccard/Lucene token similarity $\ge 0.70$
   If matched, secondary reports are flagged as potential duplicates linked to the primary incident ID.

---

### Q7: How do you guarantee event processing? What are your delivery semantics?
**Answer**:
SentinelX implements **At-Least-Once Delivery with Idempotent Consumers**:
1. **Producer Side**: Kafka producers use `acks=all`, `enable.idempotence=true`, and retries.
2. **Outbox Guarantee**: Events are written atomically with the aggregate to eliminate dual-write loss.
3. **Consumer Side**: Consumers disable auto-commit (`enable.auto.commit=false`). Before processing, each consumer executes an atomic Redis `SETNX` on `processed:event:{eventId}` with a 7-day TTL. If the key already exists, the redelivered message is safely discarded.

---

### Q8: What is eventual consistency here, and where does it occur?
**Answer**:
Eventual consistency occurs between the PostgreSQL write aggregate and downstream read projections:
- OpenSearch search index
- Analytics KPI aggregations
- Operator STOMP WebSocket feeds
When an incident is created, PostgreSQL commits immediately ($t_0$). The Outbox Publisher polls and emits to Kafka ($t_0 + 50\text{ms}$). OpenSearch indexes the event ($t_0 + 120\text{ms}$).
For ~120ms, an OpenSearch query might not reflect the newly created incident. This is an intentional AP tradeoff to ensure that slow search indexing never blocks the critical incident creation path.

---

### Q9: Why use the Transactional Outbox pattern?
**Answer**:
To solve the **Dual-Write Problem**. In distributed systems, updating a database and publishing a message to a broker cannot be bound in a single ACID transaction without 2PC (which Kafka does not support with external databases).
Transactional Outbox converts the distributed dual-write into a single local database transaction (`INSERT INTO incidents` + `INSERT INTO outbox_events`). A dedicated publisher then guarantees asynchronous publication to Kafka.

---

### Q10: How do you prevent double assignment? How does distributed locking work?
**Answer**:
If two critical incidents arrive at the same millisecond and both score Responder X as the best candidate:
1. The Assignment Service executes an atomic Redis command:
   `SET lock:responder:{responderId} {incidentId} NX EX 10`
2. Incident A acquires the lock (`OK`); Incident B receives `nil`.
3. Incident B's worker logs the contention and immediately falls back to Candidate #2 on its ranked scoring list.
4. Once assignment is completed and committed to Kafka, the lock is released or automatically expires after 10 seconds.

---

### Q11: Why REST vs gRPC?
**Answer**:
- **REST**: Best for the public perimeter and API Gateway because of universal browser support, JSON readability, and standard tooling (OpenAPI/Swagger).
- **gRPC (HTTP/2 + Protobuf)**: Best for internal high-throughput service communication (e.g. `Assignment Service -> Location Service`). Binary serialization eliminates JSON parsing overhead, and multiplexed persistent TCP connections eliminate HTTP/1.1 handshake overhead.

---

### Q12: How does Kubernetes recover a crashed service?
**Answer**:
1. **Liveness Probe**: Periodically pings `/actuator/health`. If a deadlock or unhandled JVM error causes 3 consecutive timeouts, kubelet kills the container and starts a fresh pod according to the deployment restart policy.
2. **Readiness Probe**: When a new pod boots, it does not receive ingress traffic until its DB connection pool and Kafka listeners report healthy.
3. **HPA (Horizontal Pod Autoscaler)**: If CPU utilization exceeds 75%, HPA spins up additional replicas (up to 10) to absorb the traffic surge.

---

### Q13: How do you debug a request across 10 services?
**Answer**:
Using **OpenTelemetry Distributed Tracing**:
1. The API Gateway extracts or generates a unique `X-Trace-Id` and W3C `traceparent` header.
2. Spring Cloud Gateway and internal Spring Boot services propagate the trace context across HTTP headers and Kafka message headers.
3. Every log statement contains `[trace_id, span_id]` via SLF4J MDC.
4. Traces are exported to Jaeger via OpenTelemetry Collector, allowing engineers to visualize the complete waterfall graph of a single incident flow across all 10 services in one dashboard.

---

### Q14: How does OpenTelemetry propagate trace context through Kafka?
**Answer**:
Kafka records support custom byte headers. OpenTelemetry instrumentation injects the active span's W3C TraceContext into the record header:
`traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01`
When consumer services read the message from the topic, the OTel Kafka consumer interceptor extracts this header, creates a child span linked to the producer's parent span, and sets the span ID in the thread's local MDC.

---

### Q15: How does your SLA engine work without continuous DB polling?
**Answer**:
Using Redis Sorted Sets (`ZSET`):
1. When an incident is assigned, its acknowledgment deadline is calculated (e.g. now + 2 minutes for CRITICAL).
2. The deadline is added to `sla:deadlines` with score = `epoch_millis`.
3. An 80% warning score is added to `sla:warnings` with score = `epoch_millis_warning`.
4. A lightweight background worker runs every 1000ms and executes:
   `ZRANGEBYSCORE sla:warnings 0 <current_epoch_ms>`
   `ZRANGEBYSCORE sla:deadlines 0 <current_epoch_ms>`
5. Any returned IDs trigger `incident.sla.warning` or `incident.sla.breached` Kafka events and are removed from the set.
6. When acknowledged, the incident is removed via `ZREM`.
This eliminates all database table locks and executes in $O(\log N + M)$ in-memory time.

---

### Q16: Why shouldn't AI make final critical emergency decisions?
**Answer**:
1. **Hallucinations & Non-Determinism**: LLMs and ML models can misclassify subtle linguistic phrasing or adversarial inputs.
2. **Legal & Life-Safety Liability**: Automated dispatch systems must be accountable and verifiable.
3. **SentinelX Architecture**: AI generates categorized recommendations and suggested SOP checklists. Deterministic regex rules overrule AI for explicit danger keywords, and human dispatchers retain one-click override authority.

---

### Q17: What are the primary system bottlenecks at 10x traffic? What would you change?
**Answer**:
1. **Current Bottleneck**: PostgreSQL primary write IOPS on the `outbox_events` table under massive burst conditions.
   - *10x Solution*: Implement Kafka Debezium Change Data Capture (CDC) reading PostgreSQL WAL logs directly, eliminating application-level outbox polling queries.
2. **Current Bottleneck**: Redis single-threaded event loop if millions of SLA keys are tracked.
   - *10x Solution*: Migrate from single-node Redis to Redis Cluster with hash tagging (`{incidentId}`) for distributed shard distribution.
3. **Database Sharding**: Partition `incidents` table by `campus_id` or `created_at` monthly partitions.
