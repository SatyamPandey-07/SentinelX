package com.sentinelx.common.events;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.sentinelx.common.dto.GeospatialLocationDto;
import com.sentinelx.common.enums.IncidentCategory;
import com.sentinelx.common.enums.IncidentSeverity;
import com.sentinelx.common.enums.IncidentStatus;
import java.util.List;

public record IncidentCreatedPayload(
    @JsonProperty("incident_id") String incidentId,
    @JsonProperty("reporter_id") String reporterId,
    @JsonProperty("title") String title,
    @JsonProperty("description") String description,
    @JsonProperty("category") IncidentCategory category,
    @JsonProperty("severity") IncidentSeverity severity,
    @JsonProperty("status") IncidentStatus status,
    @JsonProperty("location") GeospatialLocationDto location,
    @JsonProperty("attachment_urls") List<String> attachmentUrls,
    @JsonProperty("idempotency_key") String idempotencyKey
) {}
