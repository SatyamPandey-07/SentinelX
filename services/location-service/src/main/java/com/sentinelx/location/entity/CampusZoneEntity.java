package com.sentinelx.location.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "campus_zones")
public class CampusZoneEntity {

    @Id
    @Column(length = 64)
    private String id;

    @Column(nullable = false, length = 128)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_restricted")
    private boolean restricted = false;

    @Column(name = "min_lat")
    private Double minLat;

    @Column(name = "max_lat")
    private Double maxLat;

    @Column(name = "min_lon")
    private Double minLon;

    @Column(name = "max_lon")
    private Double maxLon;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    public CampusZoneEntity() {}

    public CampusZoneEntity(String id, String name, String description, boolean restricted, Double minLat, Double maxLat, Double minLon, Double maxLon) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.restricted = restricted;
        this.minLat = minLat;
        this.maxLat = maxLat;
        this.minLon = minLon;
        this.maxLon = maxLon;
        this.createdAt = Instant.now();
    }

    public boolean contains(double lat, double lon) {
        if (minLat == null || maxLat == null || minLon == null || maxLon == null) return false;
        return lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isRestricted() { return restricted; }
    public void setRestricted(boolean restricted) { this.restricted = restricted; }

    public Double getMinLat() { return minLat; }
    public Double getMaxLat() { return maxLat; }
    public Double getMinLon() { return minLon; }
    public Double getMaxLon() { return maxLon; }
}
