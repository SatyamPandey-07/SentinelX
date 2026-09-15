package com.sentinelx.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.List;

public record UserProfileResponse(
    @JsonProperty("id") String id,
    @JsonProperty("username") String username,
    @JsonProperty("email") String email,
    @JsonProperty("first_name") String firstName,
    @JsonProperty("last_name") String lastName,
    @JsonProperty("phone") String phone,
    @JsonProperty("role") String role,
    @JsonProperty("permissions") List<String> permissions,
    @JsonProperty("is_enabled") boolean isEnabled,
    @JsonProperty("created_at") Instant createdAt
) {}
