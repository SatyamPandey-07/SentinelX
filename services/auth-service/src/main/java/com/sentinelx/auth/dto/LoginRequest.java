package com.sentinelx.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
    @NotBlank(message = "Username or email is required")
    @JsonProperty("username")
    String username,

    @NotBlank(message = "Password is required")
    @JsonProperty("password")
    String password
) {}
