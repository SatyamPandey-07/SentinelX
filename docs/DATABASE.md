# SentinelX: Database Design & Migration Strategy

## 1. Database-Per-Service Topology

SentinelX enforces the **Database-per-Service** pattern to avoid hidden coupling and ensure independent scalability:

- `sentinelx_auth`: User credentials, roles, permissions, hashed refresh tokens.
- `sentinelx_incident`: Incidents, locations, status history, attachments, and `outbox_events`.
- `sentinelx_location`: PostGIS spatial indexes for campus zones and responder coordinates.
- `sentinelx_audit`: Cryptographic hash-chained immutable audit log.
- `sentinelx_analytics`: Response times, resolution metrics, and SLA breach logs.

---

## 2. Flyway Migration Versioning

Every service includes its own `src/main/resources/db/migration/` directory:
- `V1__init_auth_schema.sql`
- `V1__init_incident_schema.sql`
- `V1__init_location_schema.sql`
- `V1__init_audit_schema.sql`
- `V1__init_analytics_schema.sql`

Hibernate `ddl-auto: validate` is strictly enforced in production. Automated schema changes without explicit migration scripts are forbidden.

---

## 3. Optimistic Locking
The `incidents` table incorporates a `@Version Long version` column. Concurrent PATCH or state updates verify that the row was not altered by another dispatcher or consumer thread since it was read, preventing lost updates.
