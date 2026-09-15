package com.sentinelx.incident.client;

import com.sentinelx.common.enums.IncidentCategory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;
import java.util.Optional;

/**
 * Synchronous call to search-service's duplicate-check endpoint (Section 1
 * item 6, Section 10). search-service's index is populated asynchronously
 * from Kafka, so this is inherently a best-effort check against an
 * eventually-consistent view — it can miss a duplicate reported moments
 * earlier and not yet indexed, and it can also be unreachable outright.
 * Either way (Section 23: "if OpenSearch fails, incident creation must
 * still work") this only ever logs a warning; it never blocks or rejects
 * incident creation, since a false positive here would mean silently
 * refusing to record a real emergency.
 */
@Component
public class DuplicateCheckClient {

    private static final Logger log = LoggerFactory.getLogger(DuplicateCheckClient.class);

    private final RestClient restClient;

    public DuplicateCheckClient(
            @Value("${search-service.url}") String baseUrl,
            @Value("${search-service.timeout-ms:1000}") int timeoutMs) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(timeoutMs);
        factory.setReadTimeout(timeoutMs);
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .build();
    }

    @SuppressWarnings("unchecked")
    public Optional<DuplicateResult> checkDuplicate(
            String title, String description, IncidentCategory category, Double latitude, Double longitude) {
        if (latitude == null || longitude == null) {
            return Optional.empty();
        }
        try {
            Map<String, Object> body = Map.of(
                    "title", title,
                    "description", description,
                    "category", category != null ? category.name() : "OTHER",
                    "latitude", latitude,
                    "longitude", longitude);

            Map<String, Object> response = restClient.post()
                    .uri("/api/v1/search/duplicates/check")
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            if (response != null && Boolean.TRUE.equals(response.get("is_duplicate"))) {
                return Optional.of(new DuplicateResult(
                        (String) response.get("original_incident_id"),
                        ((Number) response.get("similarity_score")).doubleValue(),
                        ((Number) response.get("distance_meters")).doubleValue()));
            }
            return Optional.empty();
        } catch (Exception e) {
            log.warn("Duplicate check unavailable ({}: {}); continuing without it.",
                    e.getClass().getSimpleName(), e.getMessage());
            return Optional.empty();
        }
    }

    public record DuplicateResult(String originalIncidentId, double similarityScore, double distanceMeters) {}
}
