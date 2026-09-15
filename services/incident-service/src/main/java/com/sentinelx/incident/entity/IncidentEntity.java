package com.sentinelx.incident.entity;

import com.sentinelx.common.enums.IncidentCategory;
import com.sentinelx.common.enums.IncidentSeverity;
import com.sentinelx.common.enums.IncidentStatus;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "incidents")
public class IncidentEntity {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "reporter_id", nullable = false, length = 36)
    private String reporterId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 64)
    private IncidentCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private IncidentSeverity severity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private IncidentStatus status;

    @Column(name = "assigned_responder_id", length = 36)
    private String assignedResponderId;

    @Column(name = "sla_ack_deadline")
    private Instant slaAckDeadline;

    @Column(name = "sla_resolve_deadline")
    private Instant slaResolveDeadline;

    @Column(name = "acknowledged_at")
    private Instant acknowledgedAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    @Version
    private Long version = 0L;

    @OneToOne(mappedBy = "incident", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private IncidentLocationEntity location;

    @OneToMany(mappedBy = "incident", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<IncidentStatusHistoryEntity> statusHistory = new ArrayList<>();

    @OneToMany(mappedBy = "incident", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<IncidentAttachmentEntity> attachments = new ArrayList<>();

    public IncidentEntity() {
        this.id = UUID.randomUUID().toString();
        this.status = IncidentStatus.REPORTED;
    }

    public IncidentEntity(String reporterId, String title, String description, IncidentCategory category, IncidentSeverity severity) {
        this.id = UUID.randomUUID().toString();
        this.reporterId = reporterId;
        this.title = title;
        this.description = description;
        this.category = category;
        this.severity = severity != null ? severity : IncidentSeverity.MEDIUM;
        this.status = IncidentStatus.REPORTED;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public void addStatusTransition(IncidentStatus toStatus, String changedById, String reason) {
        IncidentStatusHistoryEntity history = new IncidentStatusHistoryEntity(this, this.status, toStatus, changedById, reason);
        this.statusHistory.add(history);
        this.status = toStatus;
    }

    public void setLocation(IncidentLocationEntity location) {
        this.location = location;
        if (location != null) {
            location.setIncident(this);
        }
    }

    public void addAttachment(String url) {
        IncidentAttachmentEntity attachment = new IncidentAttachmentEntity(this, url);
        this.attachments.add(attachment);
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getReporterId() { return reporterId; }
    public void setReporterId(String reporterId) { this.reporterId = reporterId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public IncidentCategory getCategory() { return category; }
    public void setCategory(IncidentCategory category) { this.category = category; }

    public IncidentSeverity getSeverity() { return severity; }
    public void setSeverity(IncidentSeverity severity) { this.severity = severity; }

    public IncidentStatus getStatus() { return status; }
    public void setStatus(IncidentStatus status) { this.status = status; }

    public String getAssignedResponderId() { return assignedResponderId; }
    public void setAssignedResponderId(String assignedResponderId) { this.assignedResponderId = assignedResponderId; }

    public Instant getSlaAckDeadline() { return slaAckDeadline; }
    public void setSlaAckDeadline(Instant slaAckDeadline) { this.slaAckDeadline = slaAckDeadline; }

    public Instant getSlaResolveDeadline() { return slaResolveDeadline; }
    public void setSlaResolveDeadline(Instant slaResolveDeadline) { this.slaResolveDeadline = slaResolveDeadline; }

    public Instant getAcknowledgedAt() { return acknowledgedAt; }
    public void setAcknowledgedAt(Instant acknowledgedAt) { this.acknowledgedAt = acknowledgedAt; }

    public Instant getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(Instant resolvedAt) { this.resolvedAt = resolvedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }

    public IncidentLocationEntity getLocation() { return location; }
    public List<IncidentStatusHistoryEntity> getStatusHistory() { return statusHistory; }
    public List<IncidentAttachmentEntity> getAttachments() { return attachments; }
}
