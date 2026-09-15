package com.sentinelx.common.events;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.sentinelx.common.enums.IncidentSeverity;
import java.time.Instant;

public record IncidentSlaEventPayload(
    @JsonProperty("incident_id") String incidentId,
    @JsonProperty("severity") IncidentSeverity severity,
    @JsonProperty("sla_stage") String slaStage,
    @JsonProperty("deadline") Instant deadline,
    @JsonProperty("elapsed_seconds") long elapsedSeconds,
    @JsonProperty("allowed_seconds") long allowedSeconds,
    @JsonProperty("breach_percentage") double breachPercentage
) {}
