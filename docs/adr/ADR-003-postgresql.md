# ADR-003: PostgreSQL as Primary System of Record

## Status
Accepted

## Context
Emergency and incident response requires strict ACID transaction guarantees. We cannot tolerate phantom reads, split state, or lost updates when creating an emergency record and initiating the dispatch pipeline.

## Decision
Use PostgreSQL 16 as the transactional system of record for all stateful microservices.
Key implementation standards:
1. **Isolated Databases**: Database-per-service pattern (`sentinelx_auth`, `sentinelx_incident`, `sentinelx_location`, `sentinelx_audit`, `sentinelx_analytics`). No shared tables across microservices.
2. **PostGIS**: Enabled on `sentinelx_location` for spatial indexing and radius queries.
3. **Schema Migrations**: Enforced via Flyway. Hibernate auto-ddl is disabled in production.
4. **Optimistic Locking**: Enforced on `IncidentEntity` using version fields to reject concurrent conflicting status modifications.

## Consequences
- **Positive**: Proven reliability, ACID compliance, and rich geospatial indexing with PostGIS.
- **Tradeoff**: Relational databases scale vertically for writes. Write load is mitigated by Transactional Outbox batching and offloading read queries to Redis and OpenSearch.
