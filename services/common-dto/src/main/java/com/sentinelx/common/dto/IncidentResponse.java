package com.sentinelx.common.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.sentinelx.common.enums.IncidentCategory;
import com.sentinelx.common.enums.IncidentSeverity;
import com.sentinelx.common.enums.IncidentStatus;
import java.time.Instant;
import java.util.List;

public record IncidentResponse(
    @JsonProperty("id") String id,
    @JsonProperty("reporter_id") String reporterId,
    @JsonProperty("title") String title,
    @JsonProperty("description") String description,
    @JsonProperty("category") IncidentCategory category,
    @JsonProperty("severity") IncidentSeverity severity,
    @JsonProperty("status") IncidentStatus status,
    @JsonProperty("assigned_responder_id") String assignedResponderId,
    @JsonProperty("location") GeospatialLocationDto location,
    @JsonProperty("attachment_urls") List<String> attachmentUrls,
    @JsonProperty("sla_ack_deadline") Instant slaAckDeadline,
    @JsonProperty("sla_resolve_deadline") Instant slaResolveDeadline,
    @JsonProperty("acknowledged_at") Instant acknowledgedAt,
    @JsonProperty("resolved_at") Instant resolvedAt,
    @JsonProperty("created_at") Instant createdAt,
    @JsonProperty("updated_at") Instant updatedAt
) {}
