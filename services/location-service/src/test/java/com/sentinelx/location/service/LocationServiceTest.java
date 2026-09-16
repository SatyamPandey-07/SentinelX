package com.sentinelx.location.service;

import com.sentinelx.location.entity.CampusZoneEntity;
import com.sentinelx.location.entity.ResponderEntity;
import com.sentinelx.location.repository.CampusZoneRepository;
import com.sentinelx.location.repository.ResponderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Real unit tests for the geospatial matching logic (Section 19/15):
 * Haversine distance, nearest-available-responder selection with skill
 * and radius filtering, and campus-zone bounding-box lookup.
 */
class LocationServiceTest {

    private ResponderRepository responderRepository;
    private CampusZoneRepository campusZoneRepository;
    private LocationService locationService;

    @BeforeEach
    void setUp() {
        responderRepository = mock(ResponderRepository.class);
        campusZoneRepository = mock(CampusZoneRepository.class);
        locationService = new LocationService(responderRepository, campusZoneRepository);
    }

    @Test
    void haversineDistance_sameCoordinatesIsZero() {
        double d = locationService.calculateHaversineDistanceMeters(37.7749, -122.4194, 37.7749, -122.4194);
        assertEquals(0.0, d, 0.001);
    }

    @Test
    void haversineDistance_matchesKnownRealWorldDistance() {
        // San Francisco City Hall to Golden Gate Bridge toll plaza -- real
        // published great-circle distance is ~7.9km, allow reasonable tolerance.
        double d = locationService.calculateHaversineDistanceMeters(37.7793, -122.4193, 37.8199, -122.4783);
        assertTrue(d > 6500 && d < 8500, "expected ~7.9km, got " + d + "m");
    }

    @Test
    void estimateTravelSeconds_isDistanceDividedByWalkingSpeed() {
        // 140m at 1.4 m/s (the service's fixed walking speed constant) = 100s
        assertEquals(100.0, locationService.estimateTravelSeconds(140.0), 0.01);
    }

    @Test
    void findNearestAvailableResponders_sortsByDistanceAscending() {
        ResponderEntity near = new ResponderEntity("r-near", "Near", "FIRE", "AVAILABLE", 37.7750, -122.4195, 0);
        ResponderEntity far = new ResponderEntity("r-far", "Far", "FIRE", "AVAILABLE", 37.9000, -122.6000, 0);
        when(responderRepository.findByStatus("AVAILABLE")).thenReturn(List.of(far, near));

        var results = locationService.findNearestAvailableResponders(37.7749, -122.4194, 10, 0, null);

        assertEquals(2, results.size());
        assertEquals("r-near", results.get(0).responder().getId());
        assertEquals("r-far", results.get(1).responder().getId());
        assertTrue(results.get(0).distanceMeters() < results.get(1).distanceMeters());
    }

    @Test
    void findNearestAvailableResponders_excludesResponderMissingRequiredSkill() {
        ResponderEntity medic = new ResponderEntity("r-medic", "Medic", "MEDICAL", "AVAILABLE", 37.7749, -122.4194, 0);
        ResponderEntity firefighter = new ResponderEntity("r-fire", "Fighter", "FIRE,HAZMAT", "AVAILABLE", 37.7749, -122.4194, 0);
        when(responderRepository.findByStatus("AVAILABLE")).thenReturn(List.of(medic, firefighter));

        var results = locationService.findNearestAvailableResponders(37.7749, -122.4194, 10, 0, List.of("FIRE"));

        assertEquals(1, results.size());
        assertEquals("r-fire", results.get(0).responder().getId());
    }

    @Test
    void findNearestAvailableResponders_excludesResponderOutsideMaxRadius() {
        ResponderEntity inRange = new ResponderEntity("r-in", "In", "FIRE", "AVAILABLE", 37.7750, -122.4195, 0);
        ResponderEntity outOfRange = new ResponderEntity("r-out", "Out", "FIRE", "AVAILABLE", 38.5000, -123.0000, 0);
        when(responderRepository.findByStatus("AVAILABLE")).thenReturn(List.of(inRange, outOfRange));

        var results = locationService.findNearestAvailableResponders(37.7749, -122.4194, 10, 500.0, null);

        assertEquals(1, results.size());
        assertEquals("r-in", results.get(0).responder().getId());
    }

    @Test
    void findNearestAvailableResponders_respectsMaxResultsLimit() {
        List<ResponderEntity> many = List.of(
                new ResponderEntity("r1", "A", "FIRE", "AVAILABLE", 37.7749, -122.4194, 0),
                new ResponderEntity("r2", "B", "FIRE", "AVAILABLE", 37.7750, -122.4195, 0),
                new ResponderEntity("r3", "C", "FIRE", "AVAILABLE", 37.7751, -122.4196, 0)
        );
        when(responderRepository.findByStatus("AVAILABLE")).thenReturn(many);

        var results = locationService.findNearestAvailableResponders(37.7749, -122.4194, 2, 0, null);

        assertEquals(2, results.size());
    }

    @Test
    void findZoneForCoordinates_findsZoneContainingThePoint() {
        CampusZoneEntity northZone = new CampusZoneEntity("ZONE_NORTH", "North Campus", "", false, 37.77, 37.78, -122.42, -122.41);
        CampusZoneEntity southZone = new CampusZoneEntity("ZONE_SOUTH", "South Campus", "", false, 37.70, 37.71, -122.42, -122.41);
        when(campusZoneRepository.findAll()).thenReturn(List.of(southZone, northZone));

        Optional<CampusZoneEntity> found = locationService.findZoneForCoordinates(37.775, -122.415);

        assertTrue(found.isPresent());
        assertEquals("ZONE_NORTH", found.get().getId());
    }

    @Test
    void findZoneForCoordinates_returnsEmptyWhenPointIsOutsideEveryZone() {
        CampusZoneEntity zone = new CampusZoneEntity("ZONE_NORTH", "North Campus", "", false, 37.77, 37.78, -122.42, -122.41);
        when(campusZoneRepository.findAll()).thenReturn(List.of(zone));

        Optional<CampusZoneEntity> found = locationService.findZoneForCoordinates(0.0, 0.0);

        assertTrue(found.isEmpty());
    }
}
