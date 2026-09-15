export interface Incident {
  id: string;
  reporter_id: string;
  title: string;
  description: string;
  category: 'FIRE' | 'MEDICAL' | 'SECURITY' | 'HAZMAT' | 'INFRASTRUCTURE' | 'OTHER';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'REPORTED' | 'ASSIGNED' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED';
  assigned_responder_id?: string;
  assigned_responder_name?: string;
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

export interface Responder {
  id: string;
  name: string;
  skills: string[];
  status: 'AVAILABLE' | 'EN_ROUTE' | 'ON_SCENE' | 'BUSY';
  latitude: number;
  longitude: number;
  active_incidents: number;
  phone: string;
}

export const MOCK_INCIDENTS: Incident[] = [
  {
    id: "INC-2026-0891",
    reporter_id: "usr-4412",
    title: "Chemical Spill & Toxic Vapors in Chemistry Lab 302",
    description: "Container of concentrated solvent dropped. Strong acrid fumes spreading through corridor, 2 students coughing.",
    category: "HAZMAT",
    severity: "CRITICAL",
    status: "ASSIGNED",
    assigned_responder_id: "resp-001",
    assigned_responder_name: "Capt. Sarah Miller (Hazmat / Fire)",
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      building: "Science & Chemistry Hall",
      floor: "3rd Floor",
      zone_id: "ZONE_NORTH",
      address: "100 Science Way"
    },
    sla_ack_deadline: new Date(Date.now() + 1000 * 90).toISOString(),
    created_at: new Date(Date.now() - 1000 * 30).toISOString()
  },
  {
    id: "INC-2026-0890",
    reporter_id: "usr-1109",
    title: "Student Collapsed with Acute Asthma Attack",
    description: "Student experiencing severe respiratory distress during basketball practice in South Gym.",
    category: "MEDICAL",
    severity: "HIGH",
    status: "ACKNOWLEDGED",
    assigned_responder_id: "resp-002",
    assigned_responder_name: "Dr. Alex Chen (Medical Team)",
    location: {
      latitude: 37.7725,
      longitude: -122.4215,
      building: "Athletics & Gymnasium Complex",
      floor: "Ground Floor Court 2",
      zone_id: "ZONE_SOUTH",
      address: "240 Campus Blvd"
    },
    sla_ack_deadline: new Date(Date.now() + 1000 * 240).toISOString(),
    created_at: new Date(Date.now() - 1000 * 180).toISOString(),
    acknowledged_at: new Date(Date.now() - 1000 * 120).toISOString()
  },
  {
    id: "INC-2026-0889",
    reporter_id: "usr-8831",
    title: "Power Outage & Trapped Passenger in Library Elevator #3",
    description: "Main circuit trip caused elevator to stop between floors 4 and 5. Emergency call button activated.",
    category: "INFRASTRUCTURE",
    severity: "MEDIUM",
    status: "IN_PROGRESS",
    assigned_responder_id: "resp-004",
    assigned_responder_name: "Elena Rostova (Rescue/Structural)",
    location: {
      latitude: 37.7738,
      longitude: -122.4182,
      building: "Central Library Tower",
      floor: "Shaft 3",
      zone_id: "ZONE_CENTRAL",
      address: "50 Library Plaza"
    },
    sla_ack_deadline: new Date(Date.now() + 1000 * 600).toISOString(),
    created_at: new Date(Date.now() - 1000 * 540).toISOString(),
    acknowledged_at: new Date(Date.now() - 1000 * 420).toISOString()
  },
  {
    id: "INC-2026-0888",
    reporter_id: "usr-3390",
    title: "Bicycle Theft in Progress at East Dorm Rack",
    description: "Individual using angle grinder on U-lock behind East Hall.",
    category: "SECURITY",
    severity: "LOW",
    status: "RESOLVED",
    assigned_responder_id: "resp-003",
    assigned_responder_name: "Officer Marcus Vance (Security)",
    location: {
      latitude: 37.7755,
      longitude: -122.4168,
      building: "East Dormitory Complex",
      floor: "Exterior",
      zone_id: "ZONE_NORTH",
      address: "180 East Campus Dr"
    },
    sla_ack_deadline: new Date(Date.now() - 1000 * 1200).toISOString(),
    created_at: new Date(Date.now() - 1000 * 3600).toISOString(),
    acknowledged_at: new Date(Date.now() - 1000 * 3400).toISOString(),
    resolved_at: new Date(Date.now() - 1000 * 1800).toISOString()
  }
];

export const MOCK_RESPONDERS: Responder[] = [
  {
    id: "resp-001",
    name: "Capt. Sarah Miller",
    skills: ["FIRE", "HAZMAT", "COMMAND"],
    status: "EN_ROUTE",
    latitude: 37.7745,
    longitude: -122.4190,
    active_incidents: 1,
    phone: "+1 (555) 019-4821"
  },
  {
    id: "resp-002",
    name: "Dr. Alex Chen",
    skills: ["MEDICAL", "AED", "ALS"],
    status: "ON_SCENE",
    latitude: 37.7720,
    longitude: -122.4210,
    active_incidents: 1,
    phone: "+1 (555) 019-7744"
  },
  {
    id: "resp-003",
    name: "Officer Marcus Vance",
    skills: ["SECURITY", "TACTICAL", "DE-ESCALATION"],
    status: "AVAILABLE",
    latitude: 37.7735,
    longitude: -122.4185,
    active_incidents: 0,
    phone: "+1 (555) 019-9912"
  },
  {
    id: "resp-004",
    name: "Elena Rostova",
    skills: ["STRUCTURAL", "FIRE", "HEAVY_RESCUE"],
    status: "ON_SCENE",
    latitude: 37.7750,
    longitude: -122.4170,
    active_incidents: 1,
    phone: "+1 (555) 019-3351"
  }
];

export const MOCK_AUDIT_LOGS = [
  {
    id: "aud-0091",
    principal_id: "SYSTEM_KAFKA",
    principal_role: "SYSTEM",
    action: "incident.assigned",
    resource_type: "Incident",
    resource_id: "INC-2026-0891",
    prev_hash: "a4f89d304918e77a2810f54329aa0b63e120892305781a9807492bd84091a34b",
    curr_hash: "e7bc1093847291a0b38472910485720194857201948572019485720194857201",
    occurred_at: new Date(Date.now() - 1000 * 20).toISOString()
  },
  {
    id: "aud-0090",
    principal_id: "SYSTEM_OUTBOX",
    principal_role: "SYSTEM",
    action: "incident.created",
    resource_type: "Incident",
    resource_id: "INC-2026-0891",
    prev_hash: "93bc840192837461502938475610293847561029384756102938475610293847",
    curr_hash: "a4f89d304918e77a2810f54329aa0b63e120892305781a9807492bd84091a34b",
    occurred_at: new Date(Date.now() - 1000 * 30).toISOString()
  },
  {
    id: "aud-0089",
    principal_id: "resp-002",
    principal_role: "RESPONDER",
    action: "incident.acknowledged",
    resource_type: "Incident",
    resource_id: "INC-2026-0890",
    prev_hash: "550a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcd",
    curr_hash: "93bc840192837461502938475610293847561029384756102938475610293847",
    occurred_at: new Date(Date.now() - 1000 * 120).toISOString()
  }
];
