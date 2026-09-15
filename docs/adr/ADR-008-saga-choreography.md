# ADR-008: Choreography-Based Saga for Incident Dispatch Lifecycle

## Status
Accepted

## Context
The lifecycle of an emergency involves multi-service coordination:
`Incident Created -> AI Classified -> Responder Assigned -> SLA Armed -> Notifications Dispatched -> Responder Acknowledged -> Incident Resolved`.
Distributed 2PC (Two-Phase Commit) transactions are too slow, brittle, and block threads during network partitions.

## Decision
Adopt an event-driven **Choreography-based Saga**:
- Services emit domain events over Kafka upon completing local transactions.
- Dependent services react asynchronously:
  - `incident.created` triggers Assignment Service and Search Indexer.
  - `incident.assigned` triggers SLA Engine and Notification Service.
  - `incident.acknowledged` triggers SLA cancellation and Analytics aggregation.
- If responder assignment fails or times out, compensating events (`incident.unassigned`, `incident.escalated`) are published to trigger supervisor intervention.

## Consequences
- **Positive**: High throughput, no centralized orchestrator bottleneck, and independent service deployability.
- **Tradeoff**: Distributed state tracing requires OpenTelemetry correlation IDs across all Kafka headers.
