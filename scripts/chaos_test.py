#!/usr/bin/env python3
"""
SentinelX Chaos & Resilience Engineering Validation Script (Section 23 & 24).

Every test here exercises the REAL running system -- the actual guardrail
class, the actual live services over HTTP, and the actual Kafka broker
(stopped/started via Docker) -- not an in-memory simulation of what the
system would theoretically do. Requires the full stack to be up:

    make dev

1. AI Service Degradation -> Rule-based safety fallback engages.
   (Calls the real RuleBasedSafetyGuardrail class directly.)
2. Duplicate Client Request -> Idempotent incident creation via the real
   Redis-backed Idempotency-Key mechanism in incident-service.
   (Two real HTTP POSTs with the same key against the live service.)
3. Kafka Broker Disconnect During Write -> Transactional Outbox guarantees
   zero data loss.
   (Really stops the Kafka container, creates a real incident against a
   Kafka-less incident-service, confirms the write still succeeds, restarts
   Kafka, and polls audit-service until the backlogged event actually
   arrives -- proving the OutboxPublisher's retry loop, not asserting it.)
"""

import json
import os
import subprocess
import sys
import time
import uuid

import requests

GATEWAY_URL = os.getenv("GATEWAY_URL", "http://localhost:8080")
AUDIT_SERVICE_URL = os.getenv("AUDIT_SERVICE_URL", "http://localhost:8090")
KAFKA_CONTAINER = os.getenv("KAFKA_CONTAINER", "sentinelx-kafka")

ai_service_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "services", "ai-service"))
if ai_service_path not in sys.path:
    sys.path.insert(0, ai_service_path)


class ResilienceTestSuite:

    def __init__(self):
        self.results = []

    def log_test(self, name: str, passed: bool, details: str):
        status = "[PASS]" if passed else "[FAIL]"
        print(f"{status} {name}")
        print(f"       Details: {details}\n")
        self.results.append({"test": name, "passed": passed, "details": details})

    def test_ai_service_outage_fallback(self):
        """
        Scenario: an incident matches a life-safety pattern.
        Expectation: the deterministic guardrail -- the actual fallback path
        used when the LLM/keyword classifier is unavailable or simply
        disagrees -- unconditionally forces CRITICAL. This is the real
        class incident-service's AiClassificationClient and ai-service's own
        classifiers both defer to; see AI.md / ADR-012.
        """
        print(">>> Test 1: Deterministic Safety Guardrail (real class, real evaluation)...")

        sample_title = "Massive explosion and fire in Chemistry wing"
        sample_desc = "Flames visible through roof, multiple people trapped"

        from src.classifier.rule_guardrail import RuleBasedSafetyGuardrail
        guardrail = RuleBasedSafetyGuardrail()
        override = guardrail.evaluate_override(sample_title, sample_desc)

        if override is not None:
            cat, sev, reason, actions = override
            self.log_test(
                "AI Service Outage Fallback (deterministic guardrail)",
                cat.value == "FIRE" and sev.value == "CRITICAL",
                f"Guardrail engaged: {cat.value}/{sev.value}. Reasoning: '{reason}'. "
                f"This is what fires whenever ai-service's LLM path can't be trusted, "
                f"including a full outage.",
            )
        else:
            self.log_test("AI Service Outage Fallback", False, "Safety guardrail failed to engage")

    def test_duplicate_request_idempotency(self):
        """
        Scenario: a client retries the exact same POST /incidents (e.g.
        after a timeout it never saw the response to). Expectation: the
        real Redis-backed Idempotency-Key cache in incident-service
        (IDEMPOTENCY_KEY_PREFIX) returns the SAME incident both times, and
        only one incident is actually created -- against the live,
        currently-running incident-service, not a simulated cache.
        """
        print(">>> Test 2: Duplicate Client Request Idempotency (real Redis cache, live service)...")
        try:
            token = self._register_and_login()
            idempotency_key = str(uuid.uuid4())
            body = {
                "title": f"Chaos idempotency probe {uuid.uuid4().hex[:8]}",
                "description": "Verifying duplicate POSTs collapse to one incident",
                "category": "OTHER",
                "severity": "LOW",
                "location": {
                    "latitude": 37.7749, "longitude": -122.4194,
                    "building": "Test", "floor": "1", "zone_id": "ZONE_NORTH", "address": "1 Test Way",
                },
                "attachment_urls": [],
            }
            headers = {"Authorization": f"Bearer {token}", "Idempotency-Key": idempotency_key}

            r1 = requests.post(f"{GATEWAY_URL}/api/v1/incidents", json=body, headers=headers, timeout=10)
            r2 = requests.post(f"{GATEWAY_URL}/api/v1/incidents", json=body, headers=headers, timeout=10)

            if r1.status_code not in (200, 201) or r2.status_code not in (200, 201):
                self.log_test("Duplicate Request Idempotency", False,
                               f"Unexpected status codes: {r1.status_code}, {r2.status_code}")
                return

            id1, id2 = r1.json()["id"], r2.json()["id"]
            self.log_test(
                "Duplicate Request Idempotency (real Redis cache)",
                id1 == id2,
                f"Two POSTs with Idempotency-Key={idempotency_key[:8]}... "
                f"returned incident id {id1} both times" if id1 == id2 else
                f"DUPLICATE CREATED: first={id1} second={id2}",
            )
        except Exception as e:
            self.log_test("Duplicate Request Idempotency", False, f"Test setup failed: {e}")

    def test_outbox_guarantee_under_broker_disconnect(self):
        """
        Scenario: Kafka is really stopped mid-write.
        Expectation (Transactional Outbox, Section 6): the incident INSERT
        and outbox_event INSERT commit atomically in Postgres regardless of
        Kafka's availability -- incident creation must still return 201.
        Once Kafka is restarted, the OutboxPublisher's own retry loop
        (fixed-delay-ms in incident-service/application.yml) picks the
        backlogged event up and republishes it, without this script telling
        it to -- we only poll audit-service until that shows up.
        """
        print(">>> Test 3: Kafka Broker Disconnect During Write (real docker stop/start)...")
        marker = f"CHAOS-{uuid.uuid4().hex[:10]}"
        incident_id = None
        try:
            token = self._register_and_login()

            print(f"    Stopping {KAFKA_CONTAINER}...")
            self._docker(["stop", KAFKA_CONTAINER])

            body = {
                "title": f"Outbox resilience probe {marker}",
                "description": "Created while Kafka is down -- must still persist",
                "category": "OTHER",
                "severity": "LOW",
                "location": {
                    "latitude": 37.7749, "longitude": -122.4194,
                    "building": "Test", "floor": "1", "zone_id": "ZONE_NORTH", "address": "1 Test Way",
                },
                "attachment_urls": [],
            }
            headers = {"Authorization": f"Bearer {token}", "Idempotency-Key": str(uuid.uuid4())}
            r = requests.post(f"{GATEWAY_URL}/api/v1/incidents", json=body, headers=headers, timeout=15)

            if r.status_code not in (200, 201):
                self.log_test("Outbox Dual-Write Prevention", False,
                               f"Incident creation FAILED with Kafka down: {r.status_code} {r.text} "
                               f"-- this means the write path has an undisclosed Kafka dependency")
                return

            incident_id = r.json()["id"]
            print(f"    Incident {incident_id} created successfully with Kafka down (DB write independent of Kafka)")

        finally:
            print(f"    Restarting {KAFKA_CONTAINER}...")
            self._docker(["start", KAFKA_CONTAINER])

        if incident_id is None:
            return

        # Poll audit-service until the backlogged outbox event actually
        # arrives -- proving the publisher's retry loop recovered on its
        # own, not asserting that it theoretically would.
        deadline = time.time() + 90
        found = False
        while time.time() < deadline:
            try:
                resp = requests.get(f"{AUDIT_SERVICE_URL}/api/v1/audit/events",
                                     params={"size": 200, "sort": "occurredAt,desc"}, timeout=5)
                if resp.status_code == 200:
                    events = resp.json().get("content", [])
                    if any(incident_id in json.dumps(e) for e in events):
                        found = True
                        break
            except requests.RequestException:
                pass
            time.sleep(3)

        self.log_test(
            "Outbox Dual-Write Prevention (real Kafka stop/start)",
            found,
            f"Incident {incident_id} persisted during the Kafka outage, and its outbox event "
            f"{'was' if found else 'was NOT'} recovered by the publisher after Kafka came back "
            f"(observed via audit-service's real audit trail)",
        )

    def _register_and_login(self) -> str:
        username = f"chaos_{uuid.uuid4().hex[:10]}"
        r = requests.post(f"{GATEWAY_URL}/api/v1/auth/register", json={
            "username": username,
            "email": f"{username}@sentinelx.local",
            "password": "ChaosTestPass123!",
            "first_name": "Chaos",
            "last_name": "Tester",
        }, timeout=10)
        r.raise_for_status()
        return r.json()["access_token"]

    @staticmethod
    def _docker(args):
        result = subprocess.run(["docker", *args], capture_output=True, text=True, timeout=60)
        if result.returncode != 0:
            raise RuntimeError(f"docker {' '.join(args)} failed: {result.stderr}")
        # Give the container a moment to actually come back up/tear down
        # before the next step depends on its state.
        time.sleep(5)

    def run_all(self):
        print("================================================================")
        print("SentinelX Chaos & Distributed Resilience Engineering Suite")
        print("(exercises the real running stack -- run `make dev` first)")
        print("================================================================\n")
        self.test_ai_service_outage_fallback()
        self.test_duplicate_request_idempotency()
        self.test_outbox_guarantee_under_broker_disconnect()

        total = len(self.results)
        passed = sum(1 for r in self.results if r["passed"])
        print(f"Test Summary: {passed}/{total} Scenarios Validated Resilient.")
        return 0 if passed == total else 1


if __name__ == "__main__":
    suite = ResilienceTestSuite()
    sys.exit(suite.run_all())
