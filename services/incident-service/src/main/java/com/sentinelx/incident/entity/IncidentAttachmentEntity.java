package com.sentinelx.incident.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "incident_attachments")
public class IncidentAttachmentEntity {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_id", nullable = false)
    private IncidentEntity incident;

    @Column(name = "attachment_url", nullable = false, length = 512)
    private String attachmentUrl;

    @Column(name = "uploaded_at", updatable = false)
    private Instant uploadedAt = Instant.now();

    public IncidentAttachmentEntity() {
        this.id = UUID.randomUUID().toString();
    }

    public IncidentAttachmentEntity(IncidentEntity incident, String attachmentUrl) {
        this.id = UUID.randomUUID().toString();
        this.incident = incident;
        this.attachmentUrl = attachmentUrl;
        this.uploadedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public IncidentEntity getIncident() { return incident; }
    public void setIncident(IncidentEntity incident) { this.incident = incident; }

    public String getAttachmentUrl() { return attachmentUrl; }
    public void setAttachmentUrl(String attachmentUrl) { this.attachmentUrl = attachmentUrl; }

    public Instant getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(Instant uploadedAt) { this.uploadedAt = uploadedAt; }
}
