-- Flyway Migration V1: Initial Audit Schema with Cryptographic Hash Chaining

CREATE TABLE IF NOT EXISTS audit_events (
    id VARCHAR(36) PRIMARY KEY,
    principal_id VARCHAR(64) NOT NULL,
    principal_role VARCHAR(32),
    action VARCHAR(64) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    resource_id VARCHAR(64) NOT NULL,
    payload TEXT,
    prev_hash VARCHAR(64) NOT NULL,
    curr_hash VARCHAR(64) NOT NULL,
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_occurred ON audit_events(occurred_at DESC);
CREATE INDEX idx_audit_resource ON audit_events(resource_type, resource_id);
CREATE INDEX idx_audit_principal ON audit_events(principal_id);
