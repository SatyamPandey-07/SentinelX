package com.sentinelx.common.events;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;

public record IncidentResolvedPayload(
    @JsonProperty("incident_id") String incidentId,
    @JsonProperty("resolved_by_id") String resolvedById,
    @JsonProperty("resolution_notes") String resolutionNotes,
    @JsonProperty("resolved_at") Instant resolvedAt,
    @JsonProperty("total_duration_seconds") long totalDurationSeconds
) {}
