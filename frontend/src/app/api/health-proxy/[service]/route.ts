import { NextRequest, NextResponse } from 'next/server';

// Server-side health proxy. Most backend services have no CORS
// configuration on their own actuator port (only auth-service does) --
// a browser fetching http://localhost:8082/actuator/health directly from
// http://localhost:3000 gets blocked before the request even leaves the
// browser. Routing it through this Next.js server route avoids that
// entirely: server-to-server HTTP isn't subject to CORS, and this also
// matches how a real deployment would work (a monitoring dashboard's own
// backend polls internal service health -- it doesn't expose every
// internal actuator port to the public browser).
const SERVICE_HEALTH_PATH: Record<string, string> = {
  'ai-service': '/health',
};

const SERVICE_PORTS: Record<string, number> = {
  'api-gateway': 8080,
  'auth-service': 8081,
  'incident-service': 8082,
  'assignment-service': 8083,
  'location-service': 8084,
  'sla-service': 8085,
  'search-service': 8086,
  'realtime-service': 8087,
  'notification-service': 8088,
  'analytics-service': 8089,
  'audit-service': 8090,
  'ai-service': 8000,
};

export async function GET(_req: NextRequest, { params }: { params: { service: string } }) {
  const { service } = params;
  const port = SERVICE_PORTS[service];
  if (!port) {
    return NextResponse.json({ up: false, error: 'unknown service' }, { status: 404 });
  }

  const path = SERVICE_HEALTH_PATH[service] ?? '/actuator/health';
  const start = Date.now();
  try {
    const res = await fetch(`http://localhost:${port}${path}`, { cache: 'no-store', signal: AbortSignal.timeout(4000) });
    const latencyMs = Date.now() - start;
    const body = await res.json().catch(() => null);
    const up = res.ok && (body?.status === 'UP' || body?.status === 'ok' || body?.status === 'healthy' || !!body);
    return NextResponse.json({ service, up, latencyMs, raw: body });
  } catch {
    return NextResponse.json({ service, up: false, latencyMs: null, raw: null });
  }
}
