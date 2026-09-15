package com.sentinelx.search;

import com.sentinelx.search.model.IncidentDocument;
import com.sentinelx.search.service.SearchIndexService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class DuplicateDetectionTest {

    private SearchIndexService searchIndexService;

    @BeforeEach
    void setUp() {
        searchIndexService = new SearchIndexService(150.0, 10, 0.70);
    }

    @Test
    void testDetectDuplicateWithinProximityAndTimeWindow() {
        Instant now = Instant.now();

        // 1. Initial report: two bystanders witnessing the same visible smoke
        // independently tend to describe it in near-identical short phrases
        // (this is the realistic case duplicate detection exists to catch —
        // see calculateTextSimilarity's Jaccard token-overlap: loosely
        // paraphrased reports of the same event can easily fall well below
        // any reasonable similarity threshold, so a meaningful test fixture
        // needs genuinely close wording, not just "about the same topic").
        IncidentDocument originalDoc = new IncidentDocument(
                "inc-chem-01",
                "reporter-1",
                "Smoke coming from chemistry laboratory",
                "Heavy black smoke observed near the chemistry lab entrance",
                "FIRE",
                "CRITICAL",
                "REPORTED",
                null,
                new IncidentDocument.GeoLocation(37.7749, -122.4194),
                "Chemistry Hall",
                "3",
                "ZONE_NORTH",
                "100 Science Way",
                now.minus(2, ChronoUnit.MINUTES)
        );

        searchIndexService.indexIncident(originalDoc);

        // 2. Second report 2 minutes later, 30 meters away, near-identical wording
        Optional<SearchIndexService.DuplicateMatch> duplicateMatch = searchIndexService.detectPotentialDuplicate(
                "Smoke coming from chemistry laboratory",
                "Heavy black smoke seen near the chemistry lab entrance",
                "FIRE",
                37.7751, -122.4192, // ~30m distance
                now
        );

        assertTrue(duplicateMatch.isPresent(), "System must flag secondary report as potential duplicate");
        assertEquals("inc-chem-01", duplicateMatch.get().originalIncidentId());
        assertTrue(duplicateMatch.get().distanceMeters() < 100.0);
        assertTrue(duplicateMatch.get().similarityScore() >= 0.70);
    }

    @Test
    void testDifferentCategoryOrDistantLocationIsNotMarkedDuplicate() {
        Instant now = Instant.now();

        IncidentDocument doc = new IncidentDocument(
                "inc-01", "user-1", "Smoke in lab", "Smoke in lab", "FIRE", "HIGH", "REPORTED",
                null, new IncidentDocument.GeoLocation(37.7749, -122.4194), null, null, null, null, now
        );
        searchIndexService.indexIncident(doc);

        // Distant location: 2km away
        Optional<SearchIndexService.DuplicateMatch> matchDistant = searchIndexService.detectPotentialDuplicate(
                "Smoke in lab", "Smoke in lab", "FIRE", 37.7900, -122.4000, now
        );
        assertFalse(matchDistant.isPresent(), "Incident 2km away should never be marked duplicate");

        // Different category: THEFT at same location
        Optional<SearchIndexService.DuplicateMatch> matchCategory = searchIndexService.detectPotentialDuplicate(
                "Laptop stolen", "Laptop stolen from chemistry lab", "THEFT", 37.7749, -122.4194, now
        );
        assertFalse(matchCategory.isPresent(), "Incident of different category should not be marked duplicate");
    }
}
