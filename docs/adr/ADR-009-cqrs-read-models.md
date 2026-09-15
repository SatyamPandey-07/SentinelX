# ADR-009: CQRS (Command Query Responsibility Segregation) for Read Projections

## Status
Accepted

## Context
The write workload (incident creation, status updates, responder assignments) has high consistency requirements and strict integrity constraints in PostgreSQL.
Conversely, the read workload (dispatcher dashboards, search filtering, geospatial heatmaps, MTTA/MTTR analytics) requires denormalized views and fast multi-dimensional aggregations.

## Decision
Apply CQRS principles:
1. **Command Side**: `Incident Service` handles mutations against the normalized PostgreSQL transactional schema (`incidents`, `incident_locations`, `outbox_events`).
2. **Query Side**:
   - `Search Service`: Maintains an eventually consistent OpenSearch document projection for full-text and geospatial queries.
   - `Analytics Service`: Maintains pre-computed metrics and Redis cache projections for dashboard KPIs.
3. Synchronization occurs asynchronously via Kafka events.

## Consequences
- **Positive**: Write throughput is not degraded by complex analytical queries. Read projections are optimized for UI consumption.
- **Tradeoff**: Eventual consistency between command and query sides (bounded within < 200ms).
