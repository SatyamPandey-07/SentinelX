// Real SentinelX API client. Every function here calls the live backend
// through the API Gateway (localhost:8080) -- there is no mock fallback.
// Shapes match the actual Java DTOs field-for-field (see each service's
// controller/response record), not an idealized frontend model.

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

// Location-service and search-service are read directly on their mapped
// host ports (docker-compose exposes them) -- the gateway does route
// /api/v1/location and /api/v1/search, so API_BASE covers both; kept as
// separate constants only for the direct-port health probes on
// /system-health, where each service's own actuator port matters.
export const SERVICE_PORTS: Record<string, number> = {
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

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sentinelx_token');
}

async function request<T>(path: string, options: RequestInit = {}, base = API_BASE): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${base}${path}`, { ...options, headers });

  if (res.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('sentinelx_token');
    localStorage.removeItem('sentinelx_refresh_token');
    localStorage.removeItem('sentinelx_user');
    window.location.href = '/login';
    throw new ApiError('Unauthorized', 401);
  }

  if (res.status === 204) return undefined as T;

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message = typeof body === 'object' && body?.message ? body.message : `Request failed: ${res.status}`;
    throw new ApiError(message, res.status);
  }

  return body as T;
}

// ---------------------------------------------------------------------
// Types -- match the real JSON exactly (see AI.md / controllers)
// ---------------------------------------------------------------------

export type IncidentCategory =
  | 'FIRE' | 'MEDICAL' | 'SECURITY' | 'HAZMAT' | 'INFRASTRUCTURE' | 'ELECTRICAL'
  | 'SUSPICIOUS_ACTIVITY' | 'HARASSMENT' | 'THEFT' | 'NATURAL_DISASTER'
  | 'EQUIPMENT_FAILURE' | 'OTHER';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentStatus =
  | 'REPORTED' | 'CLASSIFYING' | 'CLASSIFIED' | 'ASSIGNED' | 'ACKNOWLEDGED'
  | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';

export interface GeospatialLocation {
  latitude: number;
  longitude: number;
  building?: string;
  floor?: string;
  zone_id?: string;
  address?: string;
}

export interface Incident {
  id: string;
  reporter_id: string;
  title: string;
  description: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  assigned_responder_id: string | null;
  location: GeospatialLocation;
  attachment_urls: string[];
  sla_ack_deadline: string | null;
  sla_resolve_deadline: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface Responder {
  id: string;
  name: string;
  skills: string; // comma-separated, e.g. "FIRE,HAZMAT"
  status: string;
  latitude: number;
  longitude: number;
  activeIncidents: number;
  lastLocationUpdate: string;
}

export interface CampusZone {
  id: string;
  name: string;
  description: string;
  restricted: boolean;
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

export interface AuditEvent {
  id: string;
  principalId: string;
  principalRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  payload: string; // raw JSON string -- JSON.parse to inspect
  prevHash: string;
  currHash: string;
  occurredAt: string;
  recordedAt: string;
}

export interface AnalyticsOverview {
  total_incidents: number;
  sla_breached_count: number;
  sla_compliance_percent: number;
  response_time_seconds: { average: number; median: number; p95: number };
  resolution_time_seconds: { average: number; median: number; p95: number };
  by_category: Record<string, number>;
  by_severity: Record<string, number>;
  by_status: Record<string, number>;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user_id: string;
  username: string;
  email: string;
  role: string;
  permissions: string[];
}

// ---------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------

export function login(username: string, password: string) {
  return request<AuthResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function getMe() {
  return request<{
    id: string; username: string; email: string; first_name: string; last_name: string;
    phone: string; role: string; permissions: string[]; is_enabled: boolean; created_at: string;
  }>('/api/v1/auth/me');
}

// ---------------------------------------------------------------------
// Incidents
// ---------------------------------------------------------------------

export function listIncidents(params?: { status?: string; severity?: string; category?: string; size?: number; sort?: string }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.severity) qs.set('severity', params.severity);
  if (params?.category) qs.set('category', params.category);
  qs.set('size', String(params?.size ?? 50));
  qs.set('sort', params?.sort ?? 'createdAt,desc');
  return request<Page<Incident>>(`/api/v1/incidents?${qs.toString()}`);
}

export function getIncident(id: string) {
  return request<Incident>(`/api/v1/incidents/${id}`);
}

export function createIncident(input: {
  title: string;
  description: string;
  category: IncidentCategory;
  severity?: IncidentSeverity;
  location: GeospatialLocation;
}) {
  return request<Incident>('/api/v1/incidents', {
    method: 'POST',
    headers: { 'Idempotency-Key': crypto.randomUUID() },
    body: JSON.stringify({ ...input, attachment_urls: [] }),
  });
}

export function acknowledgeIncident(id: string) {
  return request<Incident>(`/api/v1/incidents/${id}/acknowledge`, { method: 'POST' });
}

export function resolveIncident(id: string, notes?: string) {
  return request<Incident>(`/api/v1/incidents/${id}/resolve`, {
    method: 'POST',
    body: notes ? JSON.stringify({ notes }) : undefined,
  });
}

// ---------------------------------------------------------------------
// Location (responders / zones) -- read-only REST surface
// ---------------------------------------------------------------------

export function listResponders() {
  return request<Responder[]>('/api/v1/location/responders');
}

export function listZones() {
  return request<CampusZone[]>('/api/v1/location/zones');
}

// ---------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------

export interface SearchResultDoc {
  id: string;
  reporter_id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  assigned_responder_id: string | null;
  location: { lat: number; lon: number };
  building?: string;
  floor?: string;
  zone_id?: string;
  address?: string;
  created_at: string;
}

export function searchIncidents(params: { q?: string; category?: string; severity?: string }) {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.category) qs.set('category', params.category);
  if (params.severity) qs.set('severity', params.severity);
  return request<SearchResultDoc[]>(`/api/v1/search/incidents?${qs.toString()}`);
}

// ---------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------

export function listAuditEvents(params?: { size?: number; sort?: string }) {
  const qs = new URLSearchParams();
  qs.set('size', String(params?.size ?? 50));
  qs.set('sort', params?.sort ?? 'occurredAt,desc');
  return request<Page<AuditEvent>>(`/api/v1/audit/events?${qs.toString()}`);
}

// ---------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------

export function getAnalyticsOverview() {
  return request<AnalyticsOverview>('/api/v1/analytics/overview');
}

// ---------------------------------------------------------------------
// AI / RAG (ai-service, routed through the gateway at /api/v1/ai/**)
// ---------------------------------------------------------------------

export interface RagCitation {
  document_name: string;
  section: string;
  content: string;
  relevance_score: number;
}

export interface RagQueryResponse {
  answer: string;
  citations: RagCitation[];
  confidence: number;
  disclaimer: string;
}

export function queryRag(query: string, incidentCategory?: string) {
  return request<RagQueryResponse>('/api/v1/ai/rag/query', {
    method: 'POST',
    body: JSON.stringify({ query, incident_category: incidentCategory, max_citations: 3 }),
  });
}

// ---------------------------------------------------------------------
// System health -- proxied server-side via /api/health-proxy/[service]
// (a Next.js route handler) rather than fetched directly from the
// browser: most backend services set no CORS headers on their own
// actuator port (only auth-service does), so a direct browser fetch to
// e.g. localhost:8082/actuator/health is blocked before it leaves the
// browser. Server-to-server HTTP isn't subject to CORS.
// ---------------------------------------------------------------------

export async function probeServiceHealth(serviceName: string) {
  try {
    const res = await fetch(`/api/health-proxy/${serviceName}`, { cache: 'no-store' });
    const body = await res.json();
    return { service: serviceName, up: !!body.up, latencyMs: body.latencyMs ?? null, raw: body.raw };
  } catch {
    return { service: serviceName, up: false, latencyMs: null, raw: null };
  }
}
