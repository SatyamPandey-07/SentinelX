package com.sentinelx.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 32, message = "Username must be between 3 and 32 characters")
    @JsonProperty("username")
    String username,

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @JsonProperty("email")
    String email,

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    @JsonProperty("password")
    String password,

    @NotBlank(message = "First name is required")
    @JsonProperty("first_name")
    String firstName,

    @NotBlank(message = "Last name is required")
    @JsonProperty("last_name")
    String lastName,

    @JsonProperty("phone")
    String phone,

    @JsonProperty("role")
    String role
) {}
