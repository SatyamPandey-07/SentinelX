# ADR-007: Transactional Outbox Pattern to Prevent Dual-Write Inconsistencies

## Status
Accepted

## Context
When an incident is created, two critical actions must occur:
1. Insert the incident row into PostgreSQL.
2. Publish `incident.created` to Apache Kafka.

Naively executing both in application code introduces the catastrophic **Dual-Write Problem**:
- If the database commits but the Kafka producer fails (network timeout, broker failover), the incident exists in the DB but is never dispatched to responders.
- If Kafka publishes first but the database rollback triggers, responders are dispatched to an incident that does not exist.

## Decision
Implement the **Transactional Outbox Pattern**:
1. Within a single local ACID database transaction, insert both the domain aggregate (`incidents`) and an event record (`outbox_events`). Both succeed or fail atomically.
2. A separate background worker (`OutboxPublisher`) polls pending outbox events, transmits them to Kafka with `aggregate_id` as the partition key, and updates event status to `PUBLISHED`.
3. In case of Kafka downtime, events remain in `PENDING` state and are retried with exponential backoff upon broker reconnection.

## Consequences
- **Positive**: Absolute zero lost events. Complete decoupling of DB transactions from network availability.
- **Tradeoff**: Asynchronous publishing introduces a tiny latency (typically < 100ms) before the Kafka event is emitted.
