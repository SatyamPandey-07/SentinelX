package com.sentinelx.incident.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "incident_locations")
public class IncidentLocationEntity {

    @Id
    @Column(length = 36)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_id", nullable = false)
    private IncidentEntity incident;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    @Column(length = 128)
    private String building;

    @Column(length = 32)
    private String floor;

    @Column(name = "zone_id", length = 64)
    private String zoneId;

    @Column(length = 255)
    private String address;

    public IncidentLocationEntity() {
        this.id = UUID.randomUUID().toString();
    }

    public IncidentLocationEntity(IncidentEntity incident, double latitude, double longitude, String building, String floor, String zoneId, String address) {
        this.id = UUID.randomUUID().toString();
        this.incident = incident;
        this.latitude = latitude;
        this.longitude = longitude;
        this.building = building;
        this.floor = floor;
        this.zoneId = zoneId;
        this.address = address;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public IncidentEntity getIncident() { return incident; }
    public void setIncident(IncidentEntity incident) { this.incident = incident; }

    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }

    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }

    public String getBuilding() { return building; }
    public void setBuilding(String building) { this.building = building; }

    public String getFloor() { return floor; }
    public void setFloor(String floor) { this.floor = floor; }

    public String getZoneId() { return zoneId; }
    public void setZoneId(String zoneId) { this.zoneId = zoneId; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
}
