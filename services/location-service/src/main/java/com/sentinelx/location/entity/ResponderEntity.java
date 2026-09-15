package com.sentinelx.location.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "responders")
public class ResponderEntity {

    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false, length = 128)
    private String name;

    @Column(nullable = false)
    private String skills; // Comma-separated: "FIRE,HAZMAT"

    @Column(nullable = false, length = 32)
    private String status = "AVAILABLE";

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    @Column(name = "active_incidents")
    private int activeIncidents = 0;

    @Column(name = "last_location_update")
    private Instant lastLocationUpdate = Instant.now();

    public ResponderEntity() {}

    public ResponderEntity(String id, String name, String skills, String status, double latitude, double longitude, int activeIncidents) {
        this.id = id;
        this.name = name;
        this.skills = skills;
        this.status = status;
        this.latitude = latitude;
        this.longitude = longitude;
        this.activeIncidents = activeIncidents;
        this.lastLocationUpdate = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSkills() { return skills; }
    public void setSkills(String skills) { this.skills = skills; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }

    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }

    public int getActiveIncidents() { return activeIncidents; }
    public void setActiveIncidents(int activeIncidents) { this.activeIncidents = activeIncidents; }

    public Instant getLastLocationUpdate() { return lastLocationUpdate; }
    public void setLastLocationUpdate(Instant lastLocationUpdate) { this.lastLocationUpdate = lastLocationUpdate; }
}
