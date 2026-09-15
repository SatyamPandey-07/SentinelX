package com.sentinelx.common.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record GeospatialLocationDto(
    @JsonProperty("latitude") double latitude,
    @JsonProperty("longitude") double longitude,
    @JsonProperty("building") String building,
    @JsonProperty("floor") String floor,
    @JsonProperty("zone_id") String zoneId,
    @JsonProperty("address") String address
) {}
