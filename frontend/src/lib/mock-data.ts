export interface Incident {
  id: string;
  reporter_id: string;
  title: string;
  description: string;
  category: 'FIRE' | 'MEDICAL' | 'SECURITY' | 'HAZMAT' | 'INFRASTRUCTURE' | 'OTHER';
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
  timeline?: {
    timestamp: string;
    title: string;
    description: string;
    actor: string;
  }[];
}

export interface Responder {
  id: string;
  name: string;
  unit_code: string;
  skills: string[];
  status: 'AVAILABLE' | 'EN_ROUTE' | 'ON_SCENE' | 'BUSY';
  distance_meters: number;
  latitude: number;
  longitude: number;
  active_incidents: number;
  phone: string;
  assigned_incident_id?: string;
}

export const MOCK_INCIDENTS: Incident[] = [
  {
    id: "INC-2026-00921",
    reporter_id: "usr-student-89",
    title: "Critical Medical Emergency - Unconscious Student",
    description: "Student collapsed near Chemistry Lab entrance. Unresponsive, shallow breathing observed. CPR initiated by teaching assistant.",
    category: "MEDICAL",
    severity: "CRITICAL",
    status: "ACKNOWLEDGED",
    assigned_responder_id: "R-104",
    assigned_responder_name: "Responder #R-104 (Marcus Vance - Paramedic)",
    ai_confidence: 97.4,
    ai_reasoning: "Matched high-consequence medical pattern 'unconscious' and 'shallow breathing'. Deterministic rule applied instant CRITICAL severity triage.",
    recommended_actions: [
      "Dispatch medical responder and campus EMS with AED kit",
      "Notify campus security to secure building perimeter and elevator priority",
      "Keep nearby hallway and stairwell clear for paramedic stretcher access"
    ],
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      building: "Engineering Block A",
      floor: "2nd Floor Room 204",
      zone_id: "ZONE_NORTH",
      address: "100 Science Parkway"
    },
    sla_ack_deadline: new Date(Date.now() + 1000 * 84).toISOString(), // 01:24 remaining
    created_at: "14:32:08",
    acknowledged_at: "14:34:12",
    timeline: [
      { timestamp: "14:32", title: "Incident reported", description: "Submitted via campus emergency mobile app", actor: "usr-student-89" },
      { timestamp: "14:32", title: "AI classified", description: "Classified as CRITICAL MEDICAL (Confidence 97.4%)", actor: "VIGIL AI Engine" },
      { timestamp: "14:33", title: "Responder assigned", description: "Automated scoring matched nearest unit #R-104 (320m)", actor: "Assignment Service" },
      { timestamp: "14:34", title: "Incident acknowledged", description: "Responder #R-104 confirmed dispatch en route", actor: "Responder #R-104" },
      { timestamp: "14:38", title: "Responder arrived", description: "Unit on scene at Engineering Block A, Floor 2", actor: "Responder #R-104" }
    ]
  },
  {
    id: "INC-2026-00920",
    reporter_id: "usr-4412",
    title: "Chemical Spill & Toxic Vapors in Chemistry Lab B",
    description: "5-liter solvent carboy fractured. Strong acrid fumes propagating into HVAC ductwork.",
    category: "HAZMAT",
    severity: "CRITICAL",
    status: "ASSIGNED",
    assigned_responder_id: "R-119",
    assigned_responder_name: "Responder #R-119 (Sarah Miller - Hazmat)",
    ai_confidence: 99.1,
    ai_reasoning: "Chemical spill with vapor release requires Level B containment and HVAC isolation.",
    recommended_actions: [
      "Isolate affected laboratory zone and seal ventilation dampers",
      "Notify Campus Environmental Health & Safety team",
      "Dispatch Hazmat responder team 3 with neutralizer kit",
      "Begin building evacuation protocol"
    ],
    location: {
      latitude: 37.7758,
      longitude: -122.4180,
      building: "Laboratory Block B",
      floor: "3rd Floor Lab 302",
      zone_id: "ZONE_NORTH",
      address: "120 Science Parkway"
    },
    sla_ack_deadline: new Date(Date.now() + 1000 * 180).toISOString(),
    created_at: "14:28:10",
    timeline: [
      { timestamp: "14:28", title: "Incident reported", description: "Manual pull station and text alert triggered", actor: "Lab Tech" },
      { timestamp: "14:28", title: "AI classified", description: "Classified as CRITICAL HAZMAT", actor: "VIGIL AI Engine" },
      { timestamp: "14:29", title: "Responder assigned", description: "Dispatched Hazmat unit #R-119", actor: "Assignment Service" }
    ]
  },
  {
    id: "INC-2026-00918",
    reporter_id: "usr-1109",
    title: "Armed Suspicious Individual Near East Parking Structure",
    description: "Security camera feed detected unauthorized individual carrying tactical gear near Gate 4.",
    category: "SECURITY",
    severity: "HIGH",
    status: "IN_PROGRESS",
    assigned_responder_id: "R-221",
    assigned_responder_name: "Responder #R-221 (David Kim - Tactical)",
    ai_confidence: 94.2,
    ai_reasoning: "Visual perimeter detection flagged potential unauthorized armed breach.",
    recommended_actions: [
      "Lock down East Gates 3 and 4",
      "Dispatch tactical security patrol R-221",
      "Monitor drone feed DR-01"
    ],
    location: {
      latitude: 37.7725,
      longitude: -122.4215,
      building: "East Parking Structure",
      floor: "Level 1 Gate 4",
      zone_id: "ZONE_EAST",
      address: "240 Campus Blvd"
    },
    sla_ack_deadline: new Date(Date.now() + 1000 * 300).toISOString(),
    created_at: "14:15:30",
    timeline: [
      { timestamp: "14:15", title: "Incident reported", description: "Perimeter vision sensor triggered", actor: "Perimeter Cam 12" },
      { timestamp: "14:16", title: "Responder assigned", description: "Security patrol R-221 engaged", actor: "Assignment Service" }
    ]
  },
  {
    id: "INC-2026-00915",
    reporter_id: "usr-8831",
    title: "Main Transformer Electrical Fire & Power Outage",
    description: "Transformer substation arcing observed with smoke near Substation C.",
    category: "FIRE",
    severity: "HIGH",
    status: "RESOLVED",
    assigned_responder_id: "R-119",
    assigned_responder_name: "Responder #R-119 (Sarah Miller - Hazmat/Fire)",
    ai_confidence: 98.0,
    location: {
      latitude: 37.7738,
      longitude: -122.4182,
      building: "Substation C",
      floor: "Ground Exterior",
      zone_id: "ZONE_CENTRAL",
      address: "50 Power Grid Rd"
    },
    sla_ack_deadline: new Date(Date.now() - 1000 * 1200).toISOString(),
    created_at: "13:45:00",
    acknowledged_at: "13:46:10",
    resolved_at: "14:10:45"
  }
];

export const MOCK_RESPONDERS: Responder[] = [
  {
    id: "R-104",
    name: "Marcus Vance",
    unit_code: "R-104",
    skills: ["Paramedic", "AED / CPR", "Trauma Triage"],
    status: "AVAILABLE",
    distance_meters: 320,
    latitude: 37.7742,
    longitude: -122.4201,
    active_incidents: 0,
    phone: "+1 (555) 019-2831",
    assigned_incident_id: "INC-2026-00921"
  },
  {
    id: "R-221",
    name: "David Kim",
    unit_code: "R-221",
    skills: ["Campus Security", "Tactical Containment", "Crowd Control"],
    status: "BUSY",
    distance_meters: 1200,
    latitude: 37.7718,
    longitude: -122.4230,
    active_incidents: 1,
    phone: "+1 (555) 019-8834",
    assigned_incident_id: "INC-2026-00918"
  },
  {
    id: "R-119",
    name: "Sarah Miller",
    unit_code: "R-119",
    skills: ["Fire Safety", "Hazmat Level B", "Structural Rescue"],
    status: "AVAILABLE",
    distance_meters: 740,
    latitude: 37.7752,
    longitude: -122.4170,
    active_incidents: 0,
    phone: "+1 (555) 019-4472"
  },
  {
    id: "R-305",
    name: "Elena Rostova",
    unit_code: "R-305",
    skills: ["Infrastructure Emergency", "HVAC Isolation", "Electrical"],
    status: "AVAILABLE",
    distance_meters: 950,
    latitude: 37.7735,
    longitude: -122.4190,
    active_incidents: 0,
    phone: "+1 (555) 019-7711"
  }
];

export const MOCK_SERVICES_HEALTH = [
  { name: "API Gateway", status: "HEALTHY", p95: "18ms", cpu: "14%", mem: "240MB", lag: "0ms" },
  { name: "Incident Service", status: "HEALTHY", p95: "24ms", cpu: "22%", mem: "410MB", lag: "0ms" },
  { name: "AI Service", status: "HEALTHY", p95: "713ms", cpu: "45%", mem: "1.2GB", lag: "0ms" },
  { name: "Assignment Service", status: "HEALTHY", p95: "32ms", cpu: "18%", mem: "320MB", lag: "2ms" },
  { name: "Location Service (gRPC)", status: "HEALTHY", p95: "6ms", cpu: "12%", mem: "180MB", lag: "0ms" },
  { name: "SLA Service", status: "HEALTHY", p95: "12ms", cpu: "15%", mem: "210MB", lag: "1ms" },
  { name: "Kafka Backbone", status: "HEALTHY", p95: "3ms", cpu: "38%", mem: "1.8GB", lag: "12ms" },
  { name: "Redis Mutex & Cache", status: "HEALTHY", p95: "1ms", cpu: "9%", mem: "128MB", lag: "0ms" },
  { name: "PostgreSQL (PostGIS)", status: "HEALTHY", p95: "8ms", cpu: "28%", mem: "850MB", lag: "0ms" },
  { name: "OpenSearch Indexer", status: "HEALTHY", p95: "45ms", cpu: "34%", mem: "2.1GB", lag: "4ms" },
  { name: "WebSocket Relay", status: "HEALTHY", p95: "2ms", cpu: "11%", mem: "140MB", lag: "0ms" }
];
