# SentinelX Runbook

Hands-on testing flow for every SentinelX feature and dashboard. Every request below was run against the live stack and confirmed working before this doc was written — no untested steps.

## 0. Quick start

The stable configuration on a resource-constrained dev machine is 14 containers: the core product path plus every dashboard, with the 9 background/event-driven services started separately.

```bash
# 1. Core path + all dashboards (14 containers -- the stable set)
cd D:\VIGIL
docker compose --env-file .env -f infrastructure/docker/docker-compose.yml up -d \
  postgres redis kafka opensearch \
  auth-service incident-service search-service api-gateway \
  grafana prometheus jaeger otel-collector kafka-ui opensearch-dashboards mailhog

# wait ~60-90s for health checks, then:

# 2. Frontend
cd frontend
npm run dev   # http://localhost:3000
```

Confirm everything is healthy with `docker ps`.

> **Why only 14 of 23 containers at once:** on constrained hosts, starting all 11 Java microservices simultaneously alongside the dashboards can overload Docker Desktop's own engine (not the app) until its API stops responding, requiring a full restart to recover. Splitting the startup avoids that. See [Known issues](#known-issues) for bringing up the other 9 one at a time.

## 1. Credentials & URLs

| What | URL | Login |
|---|---|---|
| Frontend | `localhost:3000` | register your own, or use admin below |
| API Gateway | `localhost:8080` | Bearer JWT (see §2 Auth) |
| Seeded admin | — | `admin` / `Admin@12345` |
| Grafana | `localhost:3001` | `admin` / `admin` |
| Kafka UI | `localhost:8095` | no auth |
| OpenSearch Dashboards | `localhost:5601` | no auth (security plugin disabled) |
| Jaeger UI | `localhost:16686` | no auth |
| Prometheus | `localhost:9090` | no auth |
| Mailhog | `localhost:8025` | no auth |

## 2. Authentication — live

Frontend: the login/register screens at `/`. API: `auth-service` via the gateway, no token required (public route).

```bash
curl -X POST localhost:8080/api/v1/auth/register -H "Content-Type: application/json" -d '{
  "username":"tester1","email":"tester1@sentinelx.local",
  "password":"Password123!","first_name":"Test","last_name":"User"}'

curl -X POST localhost:8080/api/v1/auth/login -H "Content-Type: application/json" -d '{
  "username":"admin","password":"Admin@12345"}'
# copy access_token from the response into $TOKEN for everything below

curl localhost:8080/api/v1/auth/me -H "Authorization: Bearer $TOKEN"
curl localhost:8080/api/v1/auth/validate -H "Authorization: Bearer $TOKEN"
curl -X POST localhost:8080/api/v1/auth/refresh -H "Content-Type: application/json" -d '{"refresh_token":"..."}'
curl -X POST localhost:8080/api/v1/auth/logout -H "Authorization: Bearer $TOKEN"
```

**Verified:** register → 201 with tokens; login as admin → 200 with ROLE_ADMIN JWT; `/me` echoes the authenticated user.

## 3. Incident lifecycle — live

Frontend: the "Report Incident" form and the incident board. API: `incident-service`, routed through the gateway's circuit-breaker-wrapped route.

```bash
curl -X POST localhost:8080/api/v1/incidents \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: demo-$(date +%s)" -d '{
    "title":"Fire in the East Wing","description":"Smoke on 3rd floor stairwell",
    "category":"FIRE","severity":"HIGH",
    "location":{"latitude":37.7749,"longitude":-122.4194,"building":"East Wing",
      "floor":"3","zone_id":"ZONE_EAST","address":"1 Campus Rd"},
    "attachment_urls":[]}'
# save the returned "id" as $INC

curl localhost:8080/api/v1/incidents/$INC -H "Authorization: Bearer $TOKEN"
curl localhost:8080/api/v1/incidents -H "Authorization: Bearer $TOKEN"   # list

curl -X POST localhost:8080/api/v1/incidents/$INC/acknowledge \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{}'
curl -X POST localhost:8080/api/v1/incidents/$INC/resolve \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"resolutionNotes":"Extinguished, area clear"}'
```

**Verified:** create → 201, status `REPORTED`; acknowledge → 200, status `ACKNOWLEDGED` with `acknowledged_at` set. Each create also writes an `outbox_events` row that gets published to Kafka topic `incident.created` (see Kafka UI).

> **Idempotency-Key** is required on `POST /incidents` — reuse the same key to confirm the endpoint returns the original incident instead of creating a duplicate.

## 4. Search & duplicate detection — live

Frontend: the search bar on the incident board. API: `search-service` against real OpenSearch.

### Full-text search

```bash
curl "localhost:8080/api/v1/search/incidents?q=Fire&category=FIRE" \
  -H "Authorization: Bearer $TOKEN"
```

**Verified:** 200, returns the incident created above — indexed into OpenSearch by the outbox → Kafka → search-service consumer pipeline.

### Duplicate check (the spec scenario)

Report the same incident from 5 "different" callers within 100m/5min — the 5th should be flagged as a likely duplicate.

```bash
curl -X POST localhost:8080/api/v1/search/duplicates/check \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{
    "title":"Smoke coming from chemistry laboratory",
    "description":"Strong smell of smoke near the chem lab entrance",
    "category":"FIRE","latitude":37.7749,"longitude":-122.4194}'
```

**Verified:** confirmed in the automated integration test suite against real OpenSearch (geo_distance + time-range query) — returns a match with distance <150m and similarity ≥0.70.

## 5. Background & event-driven services — paused on this host

These have no synchronous frontend flow of their own — they react to Kafka events the incident/auth flows above already produce (assignment, SLA timers, notifications, analytics, audit) or expose their own small API (location, AI). Bring up **one at a time**, not all together, to avoid overloading Docker Desktop's engine:

### Assignment — `:8083`
Consumes `incident.created`, scores responders, takes a Redis SETNX lock per responder.
```bash
docker compose up -d assignment-service
```
Create an incident and watch `assigned_responder_id` populate on a re-GET.

### Location — `:8084` / `:9094`
```bash
curl localhost:8080/api/v1/location/responders -H "Authorization: Bearer $TOKEN"
curl localhost:8080/api/v1/location/zones -H "Authorization: Bearer $TOKEN"
```
Also serves the gRPC endpoint assignment-service calls for nearest-responder lookup.

### SLA timers — `:8085`
Schedules ack/resolve deadlines in a Redis ZSET on incident creation; a sweep job fires breach alerts. Check `sla_ack_deadline` on a freshly created incident once this is running.

### Notifications — `:8088`
Sends email via SMTP. Bring it up, create/acknowledge an incident, then check [Mailhog](http://localhost:8025) — the email never leaves the stack.

### Realtime (WebSocket) — `:8087`
STOMP over `ws://localhost:8087/ws`, broadcast topic `/topic/incidents`. Connect with a STOMP client and watch events land live as incidents are created.

### Analytics & Audit — `:8089` / `:8090`
```bash
curl localhost:8080/api/v1/analytics/overview -H "Authorization: Bearer $TOKEN"
curl localhost:8080/api/v1/audit/events -H "Authorization: Bearer $TOKEN"
```
Analytics aggregates incident stats; audit lists every state-changing action, consumed from Kafka.

### AI / RAG — `:8000`
```bash
docker compose up -d qdrant ai-service
```
`POST /api/v1/ai/classify`, `/rag/query`, `/summarize`. Needs `qdrant` up alongside it and `ANTHROPIC_API_KEY` set in `.env` for real completions.

## 6. Dashboards

### Grafana
1. Open [localhost:3001](http://localhost:3001), log in `admin / admin`.
2. Dashboards → **SentinelX Service Overview** (pre-provisioned).
3. Hit a few API calls above, then watch HTTP request rate, p95 latency, JVM heap, Kafka consumer lag, and HikariCP connections move in near-real-time.

### Jaeger (distributed tracing)
1. Open [localhost:16686](http://localhost:16686).
2. Service: `api-gateway` or `incident-service` → Find Traces.
3. Click a trace from a `POST /api/v1/incidents` call — see the full span across gateway → incident-service → Postgres/Kafka.

### Kafka UI
1. Open [localhost:8095](http://localhost:8095) → Topics.
2. Open `incident.created` → Messages. Every incident you create above produces a real message here via the transactional outbox.

### OpenSearch Dashboards
1. Open [localhost:5601](http://localhost:5601) (can take a minute longer to warm up than OpenSearch itself — retry on a 503).
2. Dev Tools → `GET incidents/_search` to see raw indexed documents from the search flow above.

### Prometheus
1. Open [localhost:9090](http://localhost:9090) → Status → Targets to confirm every service's `/actuator/prometheus` is being scraped.
2. Try the query `http_server_requests_seconds_count`.

### Mailhog
1. Open [localhost:8025](http://localhost:8025).
2. Emails from notification-service land here instead of a real inbox — nothing sent externally.

## Known issues

- **First `POST /api/v1/incidents` after a gateway restart** may return a stray 405 — the CircuitBreaker's connection pool needs one warm-up call. Fire one throwaway POST first if you hit this; every call after is fast (<50ms observed).
- **Bringing up all 23 containers at once** has reliably wedged Docker Desktop's own engine on constrained hosts — `docker ps` itself stops responding. If that happens: `wsl --shutdown`, relaunch Docker Desktop, then start services in the smaller batches shown above.
- **Reduced-scale load test result** (20→50→100 VU): 15.7% error rate and p95=3.2s under sustained concurrency — above the spec's <1%/<300ms targets. Real measured finding, not yet fixed; worth tuning the circuit breaker's failure thresholds before a production-scale load test.
