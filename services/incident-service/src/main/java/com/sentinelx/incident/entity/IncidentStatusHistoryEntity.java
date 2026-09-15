package com.sentinelx.incident.entity;

import com.sentinelx.common.enums.IncidentStatus;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "incident_status_history")
public class IncidentStatusHistoryEntity {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_id", nullable = false)
    private IncidentEntity incident;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 32)
    private IncidentStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false, length = 32)
    private IncidentStatus toStatus;

    @Column(name = "changed_by_id", length = 36)
    private String changedById;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    public IncidentStatusHistoryEntity() {
        this.id = UUID.randomUUID().toString();
    }

    public IncidentStatusHistoryEntity(IncidentEntity incident, IncidentStatus fromStatus, IncidentStatus toStatus, String changedById, String reason) {
        this.id = UUID.randomUUID().toString();
        this.incident = incident;
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        this.changedById = changedById;
        this.reason = reason;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public IncidentEntity getIncident() { return incident; }
    public void setIncident(IncidentEntity incident) { this.incident = incident; }

    public IncidentStatus getFromStatus() { return fromStatus; }
    public void setFromStatus(IncidentStatus fromStatus) { this.fromStatus = fromStatus; }

    public IncidentStatus getToStatus() { return toStatus; }
    public void setToStatus(IncidentStatus toStatus) { this.toStatus = toStatus; }

    public String getChangedById() { return changedById; }
    public void setChangedById(String changedById) { this.changedById = changedById; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
