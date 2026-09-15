# ADR-002: Apache Kafka as Distributed Event Backbone

## Status
Accepted

## Context
When an emergency occurs, multiple disparate microservices require notification: Assignment Service needs to calculate nearest units, SLA Service must arm deadline timers, Realtime Service must broadcast to operator consoles, Search Service must index the incident, and Audit Service must record the state transition. Direct point-to-point REST calls create cascading failure chains where any downstream timeout blocks or fails the incident creation.

## Decision
Adopt Apache Kafka as the asynchronous event backbone with versioned event schemas (`IncidentCreatedEventV1`, etc.).
Key design parameters:
1. **Partition Key**: Set to `aggregate_id` (incident ID) ensuring strict chronological ordering of state transitions per incident.
2. **Delivery Guarantees**: At-least-once delivery with producer idempotence (`enable.idempotence=true`, `acks=all`).
3. **Dead-Letter Topics**: Poison pills and persistent failures are diverted to `{topic}.DLQ` after 3 retries with exponential backoff.

## Consequences
- **Positive**: Complete decoupling between reporting and processing services.
- **Positive**: Replayability for new analytics or audit consumers.
- **Tradeoff**: Eventual consistency requires idempotent consumer logic in all subscribers.
