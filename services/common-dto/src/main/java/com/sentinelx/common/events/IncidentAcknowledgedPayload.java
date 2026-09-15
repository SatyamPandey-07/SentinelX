package com.sentinelx.common.events;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;

public record IncidentAcknowledgedPayload(
    @JsonProperty("incident_id") String incidentId,
    @JsonProperty("responder_id") String responderId,
    @JsonProperty("acknowledged_at") Instant acknowledgedAt,
    @JsonProperty("response_latency_seconds") long responseLatencySeconds
) {}
