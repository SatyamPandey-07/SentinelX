package com.sentinelx.common.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.sentinelx.common.enums.IncidentCategory;
import com.sentinelx.common.enums.IncidentSeverity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record IncidentCreateRequest(
    @NotBlank(message = "Title is required")
    @JsonProperty("title")
    String title,

    @NotBlank(message = "Description is required")
    @JsonProperty("description")
    String description,

    @NotNull(message = "Category hint is required")
    @JsonProperty("category")
    IncidentCategory category,

    @JsonProperty("severity")
    IncidentSeverity severity,

    @NotNull(message = "Location is required")
    @JsonProperty("location")
    GeospatialLocationDto location,

    @JsonProperty("attachment_urls")
    List<String> attachmentUrls
) {}
