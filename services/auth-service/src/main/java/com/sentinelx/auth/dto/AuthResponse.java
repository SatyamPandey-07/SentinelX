package com.sentinelx.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record AuthResponse(
    @JsonProperty("access_token") String accessToken,
    @JsonProperty("refresh_token") String refreshToken,
    @JsonProperty("token_type") String tokenType,
    @JsonProperty("expires_in") long expiresIn,
    @JsonProperty("user_id") String userId,
    @JsonProperty("username") String username,
    @JsonProperty("email") String email,
    @JsonProperty("role") String role,
    @JsonProperty("permissions") List<String> permissions
) {
    public AuthResponse(String accessToken, String refreshToken, long expiresIn, String userId, String username, String email, String role, List<String> permissions) {
        this(accessToken, refreshToken, "Bearer", expiresIn, userId, username, email, role, permissions);
    }
}
