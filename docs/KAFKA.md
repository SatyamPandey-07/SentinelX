# SentinelX: Apache Kafka Event Backbone Specification

## 1. Topic Topology & Partitioning

| Topic Name | Partitions | Replication | Partition Key | Purpose |
|------------|------------|-------------|---------------|---------|
| `incident.created` | 3 | 1 (Local) / 3 (Prod) | `incident_id` | Emitted when new emergency report is committed to outbox |
| `incident.classified` | 3 | 1 / 3 | `incident_id` | AI & safety guardrail classification output |
| `incident.assigned` | 3 | 1 / 3 | `incident_id` | Unit claimed and dispatched |
| `incident.acknowledged` | 3 | 1 / 3 | `incident_id` | Responder acknowledged order; cancels SLA ack timer |
| `incident.resolved` | 3 | 1 / 3 | `incident_id` | Incident cleared on scene |
| `incident.sla.warning` | 3 | 1 / 3 | `incident_id` | 80% SLA elapsed notification |
| `incident.sla.breached` | 3 | 1 / 3 | `incident_id` | 100% SLA time exceeded alert |
| `notification.requested` | 3 | 1 / 3 | `recipient_id` | Multi-channel dispatch orders |
| `notification.requested.DLQ` | 1 | 1 / 3 | `recipient_id` | Dead-letter queue for failed alerts |

---

## 2. Partition Key Selection Strategy
**Rule**: All incident lifecycle events use `incident_id` as the partition key.
**Rationale**: Kafka guarantees strict chronological message ordering within a single partition. By partitioning on `incident_id`, all state transitions (`created -> assigned -> acknowledged -> resolved`) for a specific emergency land on the same partition and are processed sequentially, eliminating race conditions between consumer threads.

---

## 3. Dead-Letter Queue (DLQ) & Error Handling
Consumers configure Spring Kafka's `DefaultErrorHandler` paired with `DeadLetterPublishingRecoverer`:
1. When an exception occurs during consumption, the message is retried with an **exponential backoff** (1s initial delay, 2.0 multiplier, 3 maximum attempts).
2. If all 3 attempts fail, the recoverer automatically routes the poison pill to `{topic}.DLQ`.
3. The consumer offset moves forward without blocking the partition, preserving high throughput for healthy messages.
