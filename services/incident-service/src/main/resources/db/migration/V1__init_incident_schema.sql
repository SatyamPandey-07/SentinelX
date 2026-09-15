-- Flyway Migration V1: Initial Incident & Outbox Schema

CREATE TABLE IF NOT EXISTS incidents (
    id VARCHAR(36) PRIMARY KEY,
    reporter_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(64) NOT NULL,
    severity VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL,
    assigned_responder_id VARCHAR(36),
    sla_ack_deadline TIMESTAMP WITH TIME ZONE,
    sla_resolve_deadline TIMESTAMP WITH TIME ZONE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_category ON incidents(category);
CREATE INDEX idx_incidents_created ON incidents(created_at DESC);
CREATE INDEX idx_incidents_assigned_responder ON incidents(assigned_responder_id);

CREATE TABLE IF NOT EXISTS incident_locations (
    id VARCHAR(36) PRIMARY KEY,
    incident_id VARCHAR(36) NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    building VARCHAR(128),
    floor VARCHAR(32),
    zone_id VARCHAR(64),
    address VARCHAR(255)
);

CREATE INDEX idx_incident_locations_incident ON incident_locations(incident_id);
CREATE INDEX idx_incident_locations_coords ON incident_locations(latitude, longitude);

CREATE TABLE IF NOT EXISTS incident_status_history (
    id VARCHAR(36) PRIMARY KEY,
    incident_id VARCHAR(36) NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    from_status VARCHAR(32),
    to_status VARCHAR(32) NOT NULL,
    changed_by_id VARCHAR(36),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_incident_history_incident ON incident_status_history(incident_id);

CREATE TABLE IF NOT EXISTS incident_attachments (
    id VARCHAR(36) PRIMARY KEY,
    incident_id VARCHAR(36) NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    attachment_url VARCHAR(512) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transactional Outbox Table
CREATE TABLE IF NOT EXISTS outbox_events (
    id VARCHAR(36) PRIMARY KEY,
    aggregate_type VARCHAR(64) NOT NULL,
    aggregate_id VARCHAR(64) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    payload TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE,
    retry_count INTEGER DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING'
);

CREATE INDEX idx_outbox_status_created ON outbox_events(status, created_at);
CREATE INDEX idx_outbox_aggregate ON outbox_events(aggregate_type, aggregate_id);
