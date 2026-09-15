package com.sentinelx.location.controller;

import com.sentinelx.location.entity.CampusZoneEntity;
import com.sentinelx.location.entity.ResponderEntity;
import com.sentinelx.location.repository.CampusZoneRepository;
import com.sentinelx.location.repository.ResponderRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/location")
public class LocationController {

    private final ResponderRepository responderRepository;
    private final CampusZoneRepository campusZoneRepository;

    public LocationController(ResponderRepository responderRepository, CampusZoneRepository campusZoneRepository) {
        this.responderRepository = responderRepository;
        this.campusZoneRepository = campusZoneRepository;
    }

    @GetMapping("/responders")
    public ResponseEntity<List<ResponderEntity>> getResponders() {
        return ResponseEntity.ok(responderRepository.findAll());
    }

    @GetMapping("/zones")
    public ResponseEntity<List<CampusZoneEntity>> getZones() {
        return ResponseEntity.ok(campusZoneRepository.findAll());
    }
}
