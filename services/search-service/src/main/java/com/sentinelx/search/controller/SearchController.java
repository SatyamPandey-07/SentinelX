package com.sentinelx.search.controller;

import com.sentinelx.search.model.IncidentDocument;
import com.sentinelx.search.service.SearchIndexService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/search")
public class SearchController {

    private final SearchIndexService searchIndexService;

    public SearchController(SearchIndexService searchIndexService) {
        this.searchIndexService = searchIndexService;
    }

    @GetMapping("/incidents")
    public ResponseEntity<List<IncidentDocument>> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lon,
            @RequestParam(required = false) Double radius) {

        return ResponseEntity.ok(searchIndexService.searchIncidents(q, category, severity, lat, lon, radius));
    }

    @PostMapping("/duplicates/check")
    public ResponseEntity<Map<String, Object>> checkDuplicate(@RequestBody Map<String, Object> body) {
        String title = (String) body.getOrDefault("title", "");
        String description = (String) body.getOrDefault("description", "");
        String category = (String) body.getOrDefault("category", "OTHER");
        double lat = ((Number) body.getOrDefault("latitude", 0.0)).doubleValue();
        double lon = ((Number) body.getOrDefault("longitude", 0.0)).doubleValue();

        Optional<SearchIndexService.DuplicateMatch> match = searchIndexService.detectPotentialDuplicate(
                title, description, category, lat, lon, Instant.now()
        );

        if (match.isPresent()) {
            SearchIndexService.DuplicateMatch m = match.get();
            return ResponseEntity.ok(Map.of(
                    "is_duplicate", true,
                    "original_incident_id", m.originalIncidentId(),
                    "title", m.title(),
                    "similarity_score", m.similarityScore(),
                    "distance_meters", m.distanceMeters()
            ));
        } else {
            return ResponseEntity.ok(Map.of("is_duplicate", false));
        }
    }
}
