package com.sentinelx.search.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;

public record IncidentDocument(
    @JsonProperty("id") String id,
    @JsonProperty("reporter_id") String reporterId,
    @JsonProperty("title") String title,
    @JsonProperty("description") String description,
    @JsonProperty("category") String category,
    @JsonProperty("severity") String severity,
    @JsonProperty("status") String status,
    @JsonProperty("assigned_responder_id") String assignedResponderId,
    @JsonProperty("location") GeoLocation location,
    @JsonProperty("building") String building,
    @JsonProperty("floor") String floor,
    @JsonProperty("zone_id") String zoneId,
    @JsonProperty("address") String address,
    @JsonProperty("created_at") Instant createdAt
) {
    public record GeoLocation(
        @JsonProperty("lat") double lat,
        @JsonProperty("lon") double lon
    ) {}
}
