package com.sentinelx.audit.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "audit_events")
public class AuditEventEntity {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "principal_id", nullable = false, length = 64)
    private String principalId;

    @Column(name = "principal_role", length = 32)
    private String principalRole;

    @Column(nullable = false, length = 64)
    private String action;

    @Column(name = "resource_type", nullable = false, length = 64)
    private String resourceType;

    @Column(name = "resource_id", nullable = false, length = 64)
    private String resourceId;

    @Column(columnDefinition = "TEXT")
    private String payload;

    @Column(name = "prev_hash", nullable = false, length = 64)
    private String prevHash;

    @Column(name = "curr_hash", nullable = false, length = 64)
    private String currHash;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    @Column(name = "recorded_at", updatable = false)
    private Instant recordedAt = Instant.now();

    public AuditEventEntity() {
        this.id = UUID.randomUUID().toString();
    }

    public AuditEventEntity(String principalId, String principalRole, String action, String resourceType, String resourceId, String payload, String prevHash, String currHash, Instant occurredAt) {
        this.id = UUID.randomUUID().toString();
        this.principalId = principalId;
        this.principalRole = principalRole;
        this.action = action;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.payload = payload;
        this.prevHash = prevHash;
        this.currHash = currHash;
        this.occurredAt = occurredAt != null ? occurredAt : Instant.now();
        this.recordedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPrincipalId() { return principalId; }
    public void setPrincipalId(String principalId) { this.principalId = principalId; }

    public String getPrincipalRole() { return principalRole; }
    public void setPrincipalRole(String principalRole) { this.principalRole = principalRole; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getResourceType() { return resourceType; }
    public void setResourceType(String resourceType) { this.resourceType = resourceType; }

    public String getResourceId() { return resourceId; }
    public void setResourceId(String resourceId) { this.resourceId = resourceId; }

    public String getPayload() { return payload; }
    public void setPayload(String payload) { this.payload = payload; }

    public String getPrevHash() { return prevHash; }
    public void setPrevHash(String prevHash) { this.prevHash = prevHash; }

    public String getCurrHash() { return currHash; }
    public void setCurrHash(String currHash) { this.currHash = currHash; }

    public Instant getOccurredAt() { return occurredAt; }
    public void setOccurredAt(Instant occurredAt) { this.occurredAt = occurredAt; }

    public Instant getRecordedAt() { return recordedAt; }
    public void setRecordedAt(Instant recordedAt) { this.recordedAt = recordedAt; }
}
