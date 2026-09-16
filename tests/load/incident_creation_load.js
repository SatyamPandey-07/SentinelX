import http from 'k6/http';
import { check, sleep } from 'k6';

// Performance targets (Section 44 & 45):
// API P95 < 300ms, Error rate < 1%
export const options = {
  stages: [
    { duration: '30s', target: 100 },  // Ramp-up to 100 concurrent users
    { duration: '1m', target: 500 },   // Surge to 500 users
    { duration: '30s', target: 1000 }, // Peak stress at 1,000 users
    { duration: '30s', target: 0 },    // Cool-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'], // 95% of requests must complete below 300ms
    http_req_failed: ['rate<0.01'],    // Under 1% failures
  },
};

const BASE_URL = __ENV.API_GATEWAY_URL || 'http://localhost:8080';

export function setup() {
  const username = `load_${Date.now()}`;
  const res = http.post(`${BASE_URL}/api/v1/auth/register`, JSON.stringify({
    username: username,
    email: `${username}@sentinelx.local`,
    password: 'Password123!',
    first_name: 'Load',
    last_name: 'Tester'
  }), { headers: { 'Content-Type': 'application/json' } });

  const token = res.json('access_token') || '';
  return { token: token };
}

export default function (data) {
  const idempotencyKey = `k6-${__VU}-${__ITER}-${Date.now()}`;

  const payload = JSON.stringify({
    title: `Load Test Incident from VU ${__VU}`,
    description: 'Automated performance benchmark verification for SentinelX transactional outbox pipeline',
    category: 'FIRE',
    severity: 'MEDIUM',
    location: {
      latitude: 37.7749 + (Math.random() - 0.5) * 0.01,
      longitude: -122.4194 + (Math.random() - 0.5) * 0.01,
      building: 'North Engineering Hall',
      floor: '3rd Floor',
      zone_id: 'ZONE_NORTH',
      address: '100 Science Way',
    },
    attachment_urls: [],
  });

  const authHeaders = {
    'Content-Type': 'application/json',
    'Idempotency-Key': idempotencyKey,
    'X-User-Id': `load-tester-${__VU}`,
  };
  if (data && data.token) {
    authHeaders['Authorization'] = `Bearer ${data.token}`;
  }

  const params = {
    headers: authHeaders,
  };

  // 1. Benchmark Incident Creation (POST /api/v1/incidents)
  const res = http.post(`${BASE_URL}/api/v1/incidents`, payload, params);

  check(res, {
    'incident creation status 201 or 200': (r) => r.status === 201 || r.status === 200,
    'latency under 300ms': (r) => r.timings.duration < 300,
  });

  // 2. Benchmark Search Index Latency (GET /api/v1/search/incidents)
  const searchRes = http.get(`${BASE_URL}/api/v1/search/incidents?q=Load&category=FIRE`, params);
  check(searchRes, {
    'search status 200': (r) => r.status === 200,
    'search latency under 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);
}
