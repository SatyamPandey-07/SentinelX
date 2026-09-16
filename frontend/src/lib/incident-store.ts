import { MOCK_INCIDENTS } from './mock-data';

export interface IncidentRecord {
  id: string;
  reporter_id: string;
  reporter_name?: string;
  title: string;
  description: string;
  category: 'FIRE' | 'MEDICAL' | 'SECURITY' | 'HAZMAT' | 'INFRASTRUCTURE' | 'ELECTRICAL' | 'OTHER';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'REPORTED' | 'CLASSIFYING' | 'CLASSIFIED' | 'ASSIGNED' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  assigned_responder_id?: string;
  assigned_responder_name?: string;
  ai_confidence?: number;
  ai_reasoning?: string;
  recommended_actions?: string[];
  location: {
    latitude: number;
    longitude: number;
    building: string;
    floor: string;
    zone_id: string;
    address: string;
  };
  sla_ack_deadline: string;
  created_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
}

const STORAGE_KEY = 'sentinelx_shared_incidents';

export function getSharedIncidents(): IncidentRecord[] {
  if (typeof window === 'undefined') return MOCK_INCIDENTS as unknown as IncidentRecord[];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed with default mock incidents
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_INCIDENTS));
      return MOCK_INCIDENTS as unknown as IncidentRecord[];
    }
    return JSON.parse(raw);
  } catch {
    return MOCK_INCIDENTS as unknown as IncidentRecord[];
  }
}

export function saveSharedIncident(incident: IncidentRecord): IncidentRecord[] {
  if (typeof window === 'undefined') return [];
  const current = getSharedIncidents();
  const updated = [incident, ...current];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('sentinelx_incidents_updated'));
  return updated;
}

export function updateSharedIncidentStatus(
  id: string,
  newStatus: IncidentRecord['status'],
  additionalUpdates?: Partial<IncidentRecord>
): IncidentRecord[] {
  if (typeof window === 'undefined') return [];
  const current = getSharedIncidents();
  const updated = current.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        status: newStatus,
        ...(additionalUpdates || {}),
        ...(newStatus === 'ACKNOWLEDGED' && !item.acknowledged_at ? { acknowledged_at: new Date().toLocaleTimeString() } : {}),
        ...(newStatus === 'RESOLVED' && !item.resolved_at ? { resolved_at: new Date().toLocaleTimeString() } : {}),
      };
    }
    return item;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('sentinelx_incidents_updated'));
  return updated;
}
