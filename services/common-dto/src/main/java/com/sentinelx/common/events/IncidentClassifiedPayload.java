package com.sentinelx.common.events;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.sentinelx.common.enums.IncidentCategory;
import com.sentinelx.common.enums.IncidentSeverity;
import java.util.List;

public record IncidentClassifiedPayload(
    @JsonProperty("incident_id") String incidentId,
    @JsonProperty("category") IncidentCategory category,
    @JsonProperty("severity") IncidentSeverity severity,
    @JsonProperty("confidence") double confidence,
    @JsonProperty("reasoning") String reasoning,
    @JsonProperty("recommended_actions") List<String> recommendedActions,
    @JsonProperty("duplicate_of_incident_id") String duplicateOfIncidentId,
    @JsonProperty("safety_rule_applied") boolean safetyRuleApplied
) {}
