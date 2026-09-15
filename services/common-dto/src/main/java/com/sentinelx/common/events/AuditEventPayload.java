package com.sentinelx.common.events;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.Map;

public record AuditEventPayload(
    @JsonProperty("audit_id") String auditId,
    @JsonProperty("principal_id") String principalId,
    @JsonProperty("principal_role") String principalRole,
    @JsonProperty("action") String action,
    @JsonProperty("resource_type") String resourceType,
    @JsonProperty("resource_id") String resourceId,
    @JsonProperty("previous_state") Map<String, Object> previousState,
    @JsonProperty("new_state") Map<String, Object> newState,
    @JsonProperty("ip_address") String ipAddress,
    @JsonProperty("user_agent") String userAgent,
    @JsonProperty("occurred_at") Instant occurredAt
) {}
