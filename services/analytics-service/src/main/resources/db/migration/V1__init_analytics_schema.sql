-- Flyway Migration V1: Initial Analytics Schema

CREATE TABLE IF NOT EXISTS incident_metrics (
    incident_id VARCHAR(36) PRIMARY KEY,
    category VARCHAR(64) NOT NULL,
    severity VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL,
    response_time_seconds BIGINT,
    resolution_time_seconds BIGINT,
    sla_breached BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_metrics_created ON incident_metrics(created_at);
CREATE INDEX idx_metrics_category ON incident_metrics(category);
CREATE INDEX idx_metrics_severity ON incident_metrics(severity);
