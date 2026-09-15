package com.sentinelx.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public record TokenRefreshRequest(
    @NotBlank(message = "Refresh token is required")
    @JsonProperty("refresh_token")
    String refreshToken
) {}
