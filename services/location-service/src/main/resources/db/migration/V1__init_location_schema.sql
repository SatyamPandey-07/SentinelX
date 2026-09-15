-- Flyway Migration V1: Initial Location Schema

CREATE TABLE IF NOT EXISTS campus_zones (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    is_restricted BOOLEAN DEFAULT FALSE,
    min_lat DOUBLE PRECISION,
    max_lat DOUBLE PRECISION,
    min_lon DOUBLE PRECISION,
    max_lon DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS responders (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    skills VARCHAR(255) NOT NULL, -- comma separated skills: FIRE,MEDICAL,etc.
    status VARCHAR(32) NOT NULL DEFAULT 'AVAILABLE',
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    active_incidents INT DEFAULT 0,
    last_location_update TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_responders_status ON responders(status);
CREATE INDEX idx_responders_coords ON responders(latitude, longitude);

-- Seed Campus Zones
INSERT INTO campus_zones (id, name, description, is_restricted, min_lat, max_lat, min_lon, max_lon) VALUES
('ZONE_NORTH', 'North Engineering Quad', 'Engineering classrooms, computing center and laboratories', false, 37.7740, 37.7760, -122.4200, -122.4180),
('ZONE_SOUTH', 'South Medical Center', 'Campus infirmary and biochemistry laboratories', true, 37.7700, 37.7730, -122.4220, -122.4190),
('ZONE_CENTRAL', 'Central Student Union', 'Library, dining halls, student governance and auditoriums', false, 37.7730, 37.7745, -122.4195, -122.4175)
ON CONFLICT (id) DO NOTHING;

-- Seed Active Responders (Section 15 Candidate scenarios)
INSERT INTO responders (id, name, skills, status, latitude, longitude, active_incidents) VALUES
('resp-001', 'Captain Sarah Miller (Fire Squad)', 'FIRE,HAZMAT', 'AVAILABLE', 37.7745, -122.4190, 0),
('resp-002', 'Dr. Alex Chen (Medical Team)', 'MEDICAL,GENERAL_FIRST_AID', 'AVAILABLE', 37.7720, -122.4210, 1),
('resp-003', 'Officer Marcus Vance (Security)', 'SECURITY', 'AVAILABLE', 37.7735, -122.4185, 0),
('resp-004', 'Elena Rostova (Fire/Rescue)', 'FIRE,STRUCTURAL', 'AVAILABLE', 37.7750, -122.4170, 2)
ON CONFLICT (id) DO NOTHING;
