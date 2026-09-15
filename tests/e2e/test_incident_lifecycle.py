#!/usr/bin/env python3
"""
SentinelX End-to-End Incident Lifecycle Test (Section 28).

Exercises the REAL running system over its actual HTTP APIs -- no mocks, no
in-memory simulation of "what the system would do." Requires the full stack
to be up and reachable on localhost:

    make dev
    # or: docker compose --env-file .env -f infrastructure/docker/docker-compose.yml up -d

Flow under test, matching Section 1's numbered incident pipeline:

  register + login (auth-service, via api-gateway)
   -> POST incident (api-gateway -> incident-service)
      -> AI classification (incident-service -> ai-service, real HTTP call)
      -> duplicate check (incident-service -> search-service)
      -> Transactional Outbox -> Kafka `incident.created`
         -> assignment-service (gRPC to location-service, Redis distributed
            lock against double-assignment) -> Kafka `incident.assigned`
            -> incident-service consumes -> status ASSIGNED + responder set
            -> audit-service records a tamper-evident hash-chained entry
            -> search-service indexes into OpenSearch (eventually consistent)

Every assertion polls the REAL service that owns that fact, with a bounded
timeout. This system is event-driven and eventually consistent by design
(Section 8/10) -- asserting synchronously would be testing a consistency
model the system doesn't actually have.
"""

import json
import os
import sys
import time
import uuid

import requests

GATEWAY_URL = os.getenv("GATEWAY_URL", "http://localhost:8080")
AUDIT_SERVICE_URL = os.getenv("AUDIT_SERVICE_URL", "http://localhost:8090")
SEARCH_SERVICE_URL = os.getenv("SEARCH_SERVICE_URL", "http://localhost:8086")

DEFAULT_POLL_TIMEOUT_SECONDS = 20
POLL_INTERVAL_SECONDS = 1


class E2ETestFailure(AssertionError):
    pass


def log(msg: str) -> None:
    print(f"[e2e] {msg}", flush=True)


def poll_until(description, fn, timeout=DEFAULT_POLL_TIMEOUT_SECONDS, interval=POLL_INTERVAL_SECONDS):
    """Poll fn() until it returns a truthy value; raise E2ETestFailure on timeout."""
    deadline = time.time() + timeout
    last_result = None
    while time.time() < deadline:
        last_result = fn()
        if last_result:
            return last_result
        time.sleep(interval)
    raise E2ETestFailure(f"Timed out after {timeout}s waiting for: {description} (last result: {last_result!r})")


def wait_for_services_healthy():
    checks = {
        "postgres-backed auth-service": "http://localhost:8081/actuator/health",
        "incident-service": "http://localhost:8082/actuator/health",
        "assignment-service": "http://localhost:8083/actuator/health",
        "location-service": "http://localhost:8084/actuator/health",
        "search-service": "http://localhost:8086/actuator/health",
        "audit-service": "http://localhost:8090/actuator/health",
        "ai-service": "http://localhost:8000/health",
        "api-gateway": "http://localhost:8080/actuator/health",
    }
    for name, url in checks.items():
        def check(u=url):
            try:
                r = requests.get(u, timeout=3)
                return r.status_code == 200
            except requests.RequestException:
                return False
        poll_until(f"{name} healthy at {url}", check, timeout=90)
        log(f"healthy: {name}")


def register_and_login() -> str:
    username = f"e2e_{uuid.uuid4().hex[:10]}"
    password = "E2ETestPass123!"
    email = f"{username}@sentinelx.local"

    r = requests.post(
        f"{GATEWAY_URL}/api/v1/auth/register",
        json={
            "username": username,
            "email": email,
            "password": password,
            "first_name": "E2E",
            "last_name": "Tester",
        },
        timeout=10,
    )
    if r.status_code not in (200, 201):
        raise E2ETestFailure(f"Registration failed: {r.status_code} {r.text}")
    token = r.json()["access_token"]
    log(f"registered and authenticated as {username}")
    return token


def create_incident(token, title, description, category="OTHER", severity=None, lat=37.7749, lon=-122.4194):
    body = {
        "title": title,
        "description": description,
        "category": category,
        "location": {
            "latitude": lat,
            "longitude": lon,
            "building": "Test Hall",
            "floor": "1",
            "zone_id": "ZONE_NORTH",
            "address": "1 Test Way",
        },
        "attachment_urls": [],
    }
    if severity:
        body["severity"] = severity

    headers = {"Authorization": f"Bearer {token}", "Idempotency-Key": str(uuid.uuid4())}

    # Spring Cloud Gateway's actuator health can report UP slightly before
    # its reactive route table has finished warming up -- a real request
    # right after startup can get a transient 404/405 for a route that
    # works a moment later. This is a legitimate startup race, not
    # something to paper over silently: retry briefly, and if it's still
    # failing after the grace window, treat it as a real failure.
    deadline = time.time() + 10
    last_response = None
    while time.time() < deadline:
        last_response = requests.post(f"{GATEWAY_URL}/api/v1/incidents", json=body, headers=headers, timeout=15)
        if last_response.status_code in (200, 201):
            return last_response.json()
        if last_response.status_code not in (404, 405):
            break
        time.sleep(1)

    raise E2ETestFailure(f"Incident creation failed: {last_response.status_code} {last_response.text}")


def get_incident(token, incident_id):
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.get(f"{GATEWAY_URL}/api/v1/incidents/{incident_id}", headers=headers, timeout=10)
    if r.status_code == 404:
        return None
    if r.status_code != 200:
        # A real server error is not "not ready yet" -- surfacing it
        # immediately previously got masked as an indefinite poll timeout
        # (a real bug: getIncident()'s cache-miss path threw
        # LazyInitializationException on the attachments collection).
        raise E2ETestFailure(f"GET incident {incident_id} failed: {r.status_code} {r.text}")
    return r.json()


def test_ai_classification_upgrades_vague_report(token):
    """
    Section 1 items 4-5: a vaguely-categorized report of a real hazard must
    come back reclassified by ai-service, not stuck at the reporter's guess.
    """
    log("TEST: AI classification reclassifies a vague report")
    incident = create_incident(
        token,
        title="Water leaking from ceiling",
        description="Steady drip of water from a ceiling tile forming a puddle on the carpet, no immediate danger",
        category="OTHER",
    )
    incident_id = incident["id"]
    log(f"created incident {incident_id} as category=OTHER, no severity (reporter's best guess)")

    def reclassified():
        current = get_incident(token, incident_id)
        return current if current and current["category"] != "OTHER" else None

    result = poll_until("AI reclassification away from the reporter's OTHER guess", reclassified)
    assert result["category"] == "INFRASTRUCTURE", f"expected INFRASTRUCTURE, got {result['category']}"
    log(f"PASS: AI classified as {result['category']}/{result['severity']}")
    return incident_id


def test_safety_guardrail_forces_critical(token):
    """
    Section 11: a life-safety pattern must be forced to CRITICAL
    deterministically -- never left to probabilistic AI/LLM judgment -- even
    when the reporter under-reports severity.
    """
    log("TEST: deterministic safety guardrail overrides reporter-supplied severity")
    incident = create_incident(
        token,
        title="Active shooter reported",
        description="Someone with a gun is in the science building, shots fired",
        category="OTHER",
        severity="LOW",  # reporter panicking / under-selling it -- must not matter
    )
    incident_id = incident["id"]

    def forced_critical():
        current = get_incident(token, incident_id)
        return current if current and current["severity"] == "CRITICAL" else None

    result = poll_until("severity forced to CRITICAL by the safety guardrail", forced_critical)
    assert result["category"] == "SECURITY", f"expected SECURITY, got {result['category']}"
    log(f"PASS: guardrail forced category={result['category']} severity={result['severity']} "
        f"(reporter had said severity=LOW)")
    return incident_id


def test_full_incident_pipeline(token):
    """
    Full pipeline (Section 28): create -> classify -> Kafka incident.created
    -> assignment-service (gRPC + Redis lock) -> Kafka incident.assigned ->
    incident-service applies the assignment -> audit trail -> search index.
    """
    log("TEST: full create -> classify -> assign -> audit -> search pipeline")
    unique_marker = f"E2E{uuid.uuid4().hex[:10]}"
    incident = create_incident(
        token,
        title=f"Fire alarm triggered in Chemistry Hall {unique_marker}",
        description="Smoke detected near lab 302, fire alarm sounding",
        category="FIRE",
        severity="HIGH",
    )
    incident_id = incident["id"]
    log(f"created incident {incident_id}")

    # 1. Assignment: incident-service only reaches ASSIGNED after the full
    # incident.created -> assignment-service -> incident.assigned round trip
    # (real gRPC call to location-service, real Redis distributed lock).
    def is_assigned():
        current = get_incident(token, incident_id)
        return current if current and current["status"] == "ASSIGNED" and current["assigned_responder_id"] else None

    # A longer timeout than the other polls: if a consumer in
    # incident-service-group was recently restarted, Kafka's consumer-group
    # rebalance protocol makes the *old* member's session time out
    # (default ~10-20s) before the new member is handed the partition --
    # a real, expected characteristic of consumer groups, not something to
    # engineer around here.
    assigned = poll_until("incident reaches ASSIGNED status with a responder", is_assigned, timeout=40)
    log(f"PASS: assigned to responder {assigned['assigned_responder_id']}, "
        f"SLA ack deadline {assigned['sla_ack_deadline']}")

    # 2. Search index: search-service consumes incident.created
    # asynchronously and is eventually (not immediately) consistent (Section 10).
    def is_indexed():
        r = requests.get(f"{SEARCH_SERVICE_URL}/api/v1/search/incidents",
                          params={"q": unique_marker}, timeout=5)
        if r.status_code != 200:
            return None
        hits = [d for d in r.json() if d["id"] == incident_id]
        return hits or None

    poll_until("incident appears in the search index", is_indexed)
    log("PASS: incident indexed via search-service")

    # 3. Audit trail: audit-service records a tamper-evident hash-chained
    # entry for every lifecycle event (Section 22/34).
    def has_audit_entry():
        r = requests.get(f"{AUDIT_SERVICE_URL}/api/v1/audit/events",
                          params={"size": 200, "sort": "occurredAt,desc"}, timeout=5)
        if r.status_code != 200:
            return None
        events = r.json().get("content", [])
        matches = [e for e in events if incident_id in json.dumps(e)]
        return matches or None

    poll_until("audit trail contains an entry for this incident", has_audit_entry)
    log("PASS: audit-service recorded the incident lifecycle event")

    return incident_id


def main() -> int:
    print("=" * 72)
    print("SentinelX End-to-End Incident Lifecycle Test (real running system)")
    print("=" * 72)

    try:
        wait_for_services_healthy()
        token = register_and_login()
    except Exception as e:
        log(f"FATAL: could not reach a running stack: {e}")
        log("Is the full stack up? Run: make dev")
        return 1

    scenarios = [
        ("AI classification upgrades a vague report", test_ai_classification_upgrades_vague_report),
        ("Safety guardrail forces CRITICAL despite reporter input", test_safety_guardrail_forces_critical),
        ("Full pipeline: create -> assign -> audit -> search", test_full_incident_pipeline),
    ]

    results = []
    for name, fn in scenarios:
        try:
            fn(token)
            results.append((name, True, None))
        except Exception as e:
            results.append((name, False, str(e)))
            log(f"FAIL: {name}: {e}")

    print("\n" + "=" * 72)
    print("Results")
    print("=" * 72)
    passed = 0
    for name, ok, err in results:
        status = "PASS" if ok else "FAIL"
        print(f"[{status}] {name}" + (f" -- {err}" if err else ""))
        passed += 1 if ok else 0
    print(f"\n{passed}/{len(results)} scenarios passed")
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())
