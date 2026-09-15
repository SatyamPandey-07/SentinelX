package com.sentinelx.analytics.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "incident_metrics")
public class IncidentMetricEntity {

    @Id
    @Column(name = "incident_id", length = 36)
    private String incidentId;

    @Column(nullable = false, length = 64)
    private String category;

    @Column(nullable = false, length = 32)
    private String severity;

    @Column(nullable = false, length = 32)
    private String status;

    @Column(name = "response_time_seconds")
    private Long responseTimeSeconds;

    @Column(name = "resolution_time_seconds")
    private Long resolutionTimeSeconds;

    @Column(name = "sla_breached")
    private boolean slaBreached = false;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "acknowledged_at")
    private Instant acknowledgedAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    public IncidentMetricEntity() {}

    public IncidentMetricEntity(String incidentId, String category, String severity, String status, Instant createdAt) {
        this.incidentId = incidentId;
        this.category = category;
        this.severity = severity;
        this.status = status;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
        this.slaBreached = false;
    }

    public String getIncidentId() { return incidentId; }
    public void setIncidentId(String incidentId) { this.incidentId = incidentId; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getResponseTimeSeconds() { return responseTimeSeconds; }
    public void setResponseTimeSeconds(Long responseTimeSeconds) { this.responseTimeSeconds = responseTimeSeconds; }

    public Long getResolutionTimeSeconds() { return resolutionTimeSeconds; }
    public void setResolutionTimeSeconds(Long resolutionTimeSeconds) { this.resolutionTimeSeconds = resolutionTimeSeconds; }

    public boolean isSlaBreached() { return slaBreached; }
    public void setSlaBreached(boolean slaBreached) { this.slaBreached = slaBreached; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getAcknowledgedAt() { return acknowledgedAt; }
    public void setAcknowledgedAt(Instant acknowledgedAt) { this.acknowledgedAt = acknowledgedAt; }

    public Instant getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(Instant resolvedAt) { this.resolvedAt = resolvedAt; }
}
