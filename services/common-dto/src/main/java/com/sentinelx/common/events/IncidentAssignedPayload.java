package com.sentinelx.common.events;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;

public record IncidentAssignedPayload(
    @JsonProperty("incident_id") String incidentId,
    @JsonProperty("responder_id") String responderId,
    @JsonProperty("responder_name") String responderName,
    @JsonProperty("match_score") double matchScore,
    @JsonProperty("distance_meters") double distanceMeters,
    @JsonProperty("assigned_at") Instant assignedAt,
    @JsonProperty("sla_ack_deadline") Instant slaAckDeadline
) {}
