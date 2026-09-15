package com.sentinelx.search.service;

import com.sentinelx.search.model.IncidentDocument;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.opensearch.client.opensearch.OpenSearchClient;
import org.opensearch.client.opensearch._types.FieldValue;
import org.opensearch.client.opensearch._types.SortOrder;
import org.opensearch.client.opensearch._types.mapping.DateProperty;
import org.opensearch.client.opensearch._types.mapping.GeoPointProperty;
import org.opensearch.client.opensearch._types.mapping.KeywordProperty;
import org.opensearch.client.opensearch._types.mapping.Property;
import org.opensearch.client.opensearch._types.mapping.TextProperty;
import org.opensearch.client.opensearch._types.mapping.TypeMapping;
import org.opensearch.client.opensearch._types.query_dsl.Query;
import org.opensearch.client.opensearch.core.SearchResponse;
import org.opensearch.client.opensearch.indices.ExistsRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Search & duplicate-detection over incidents, backed by OpenSearch.
 *
 * Distributed Principle (Section 10 & 23):
 * PostgreSQL is the source of truth; this index is populated asynchronously
 * from {@code incident.created} Kafka events and is therefore eventually
 * consistent. If OpenSearch is temporarily unreachable, incident creation
 * (which never talks to this service synchronously) is unaffected, and this
 * service degrades to an in-memory replica built from the same Kafka stream
 * rather than failing search/duplicate-check requests outright.
 */
@Service
public class SearchIndexService {

    private static final Logger log = LoggerFactory.getLogger(SearchIndexService.class);

    // In-process fallback used only when OpenSearch is unreachable, and
    // always used verbatim in unit tests (constructed with a null client).
    private final Map<String, IncidentDocument> localIndex = new ConcurrentHashMap<>();

    @Nullable
    private final OpenSearchClient openSearchClient;
    private final String indexName;

    private final double maxDistanceThreshold;
    private final int timeWindowMinutes;
    private final double textSimilarityThreshold;

    // Explicit @Autowired is required here: with two constructors and
    // neither previously annotated, Spring couldn't disambiguate which one
    // to use for dependency injection and failed at startup with "No
    // default constructor found" — it was trying (and failing) to fall
    // back to a no-arg constructor that doesn't exist. Only ever surfaced
    // by actually running the container, not by compiling or unit-testing
    // it (unit tests call the 3-arg constructor directly).
    @Autowired
    public SearchIndexService(
            @Nullable OpenSearchClient openSearchClient,
            @Value("${opensearch.index-name:sentinelx-incidents}") String indexName,
            @Value("${duplicates.distance-meters-threshold:150.0}") double maxDistanceThreshold,
            @Value("${duplicates.time-window-minutes:10}") int timeWindowMinutes,
            @Value("${duplicates.text-similarity-min-score:0.70}") double textSimilarityThreshold) {
        this.openSearchClient = openSearchClient;
        this.indexName = indexName;
        this.maxDistanceThreshold = maxDistanceThreshold;
        this.timeWindowMinutes = timeWindowMinutes;
        this.textSimilarityThreshold = textSimilarityThreshold;
    }

    /** Test/in-memory-only convenience constructor — no OpenSearch backing. */
    public SearchIndexService(double maxDistanceThreshold, int timeWindowMinutes, double textSimilarityThreshold) {
        this(null, "sentinelx-incidents-test", maxDistanceThreshold, timeWindowMinutes, textSimilarityThreshold);
    }

    @PostConstruct
    void ensureIndexExists() {
        if (openSearchClient == null) {
            return;
        }
        try {
            boolean exists = openSearchClient.indices().exists(ExistsRequest.of(e -> e.index(indexName))).value();
            if (!exists) {
                openSearchClient.indices().create(c -> c.index(indexName).mappings(this::indexMappings));
                log.info("Created OpenSearch index '{}'", indexName);
            }
        } catch (Exception e) {
            log.warn("OpenSearch unavailable at startup ({}); search-service will serve from its in-memory "
                    + "fallback cache until OpenSearch recovers. Index will be created lazily on first successful call.",
                    e.getMessage());
        }
    }

    private TypeMapping.Builder indexMappings(TypeMapping.Builder m) {
        return m
                .properties("id", Property.of(p -> p.keyword(KeywordProperty.of(k -> k))))
                .properties("title", Property.of(p -> p.text(TextProperty.of(t -> t))))
                .properties("description", Property.of(p -> p.text(TextProperty.of(t -> t))))
                .properties("category", Property.of(p -> p.keyword(KeywordProperty.of(k -> k))))
                .properties("severity", Property.of(p -> p.keyword(KeywordProperty.of(k -> k))))
                .properties("status", Property.of(p -> p.keyword(KeywordProperty.of(k -> k))))
                .properties("location", Property.of(p -> p.geoPoint(GeoPointProperty.of(g -> g))))
                .properties("created_at", Property.of(p -> p.date(DateProperty.of(d -> d))));
    }

    public void indexIncident(IncidentDocument doc) {
        localIndex.put(doc.id(), doc);

        if (openSearchClient == null) {
            log.info("Indexed incident {} in local fallback cache (OpenSearch client not configured)", doc.id());
            return;
        }
        try {
            openSearchClient.index(i -> i.index(indexName).id(doc.id()).document(doc));
            log.info("Indexed incident {} into OpenSearch (title='{}')", doc.id(), doc.title());
        } catch (Exception e) {
            log.warn("OpenSearch indexing failed for incident {}; kept in local fallback cache only. "
                    + "Index will be inconsistent for this document until OpenSearch recovers and reprocesses "
                    + "the Kafka event. Cause: {}", doc.id(), e.getMessage());
        }
    }

    public List<IncidentDocument> searchIncidents(
            String queryText,
            String category,
            String severity,
            Double lat,
            Double lon,
            Double radiusMeters) {

        if (openSearchClient != null) {
            try {
                return searchViaOpenSearch(queryText, category, severity, lat, lon, radiusMeters);
            } catch (Exception e) {
                log.warn("OpenSearch search failed, falling back to in-memory replica: {}", e.getMessage());
            }
        }
        return searchLocal(queryText, category, severity, lat, lon, radiusMeters);
    }

    private List<IncidentDocument> searchViaOpenSearch(
            String queryText, String category, String severity, Double lat, Double lon, Double radiusMeters) throws Exception {

        SearchResponse<IncidentDocument> response = openSearchClient.search(s -> {
            s.index(indexName).sort(so -> so.field(f -> f.field("created_at").order(SortOrder.Desc)));
            s.query(q -> q.bool(b -> {
                if (queryText != null && !queryText.isBlank()) {
                    b.must(mu -> mu.multiMatch(mm -> mm.query(queryText).fields("title^2", "description")));
                } else {
                    b.must(mu -> mu.matchAll(ma -> ma));
                }
                if (category != null && !category.isBlank()) {
                    b.filter(f -> f.term(t -> t.field("category").value(FieldValue.of(category.toUpperCase()))));
                }
                if (severity != null && !severity.isBlank()) {
                    b.filter(f -> f.term(t -> t.field("severity").value(FieldValue.of(severity.toUpperCase()))));
                }
                if (lat != null && lon != null && radiusMeters != null) {
                    b.filter(f -> f.geoDistance(g -> g
                            .field("location")
                            .distance(radiusMeters + "m")
                            .location(loc -> loc.latlon(ll -> ll.lat(lat).lon(lon)))));
                }
                return b;
            }));
            return s;
        }, IncidentDocument.class);

        return response.hits().hits().stream()
                .map(org.opensearch.client.opensearch.core.search.Hit::source)
                .filter(Objects::nonNull)
                .toList();
    }

    private List<IncidentDocument> searchLocal(
            String queryText, String category, String severity, Double lat, Double lon, Double radiusMeters) {

        return localIndex.values().stream()
                .filter(doc -> {
                    if (category != null && !category.isBlank() && !category.equalsIgnoreCase(doc.category())) {
                        return false;
                    }
                    if (severity != null && !severity.isBlank() && !severity.equalsIgnoreCase(doc.severity())) {
                        return false;
                    }
                    if (queryText != null && !queryText.isBlank()) {
                        String full = (doc.title() + " " + doc.description()).toLowerCase();
                        if (!full.contains(queryText.toLowerCase())) {
                            return false;
                        }
                    }
                    if (lat != null && lon != null && radiusMeters != null && doc.location() != null) {
                        double dist = calculateDistanceMeters(lat, lon, doc.location().lat(), doc.location().lon());
                        if (dist > radiusMeters) {
                            return false;
                        }
                    }
                    return true;
                })
                .sorted(Comparator.comparing(IncidentDocument::createdAt).reversed())
                .toList();
    }

    /**
     * Duplicate Incident Detection (Section 10):
     * Evaluates composite similarity over a candidate set narrowed by
     * OpenSearch (category + geo_distance + time-range filter), then scores
     * text similarity locally since Jaccard token overlap isn't a native
     * OpenSearch relevance function and the candidate set is always small.
     * Falls back to scanning the in-memory replica if OpenSearch is down.
     */
    public Optional<DuplicateMatch> detectPotentialDuplicate(
            String title,
            String description,
            String category,
            double lat,
            double lon,
            Instant timestamp) {

        Instant effectiveTime = timestamp != null ? timestamp : Instant.now();

        Collection<IncidentDocument> candidates = null;
        if (openSearchClient != null) {
            try {
                candidates = fetchDuplicateCandidates(category, lat, lon, effectiveTime);
            } catch (Exception e) {
                log.warn("OpenSearch duplicate-candidate lookup failed, falling back to in-memory replica: {}", e.getMessage());
            }
        }
        if (candidates == null) {
            candidates = localIndex.values();
        }

        for (IncidentDocument existing : candidates) {
            if (!existing.category().equalsIgnoreCase(category)) {
                continue;
            }
            if (existing.createdAt() != null) {
                long minutesDiff = Math.abs(Duration.between(existing.createdAt(), effectiveTime).toMinutes());
                if (minutesDiff > timeWindowMinutes) {
                    continue;
                }
            }
            if (existing.location() == null) {
                continue;
            }
            double distanceMeters = calculateDistanceMeters(lat, lon, existing.location().lat(), existing.location().lon());
            if (distanceMeters > maxDistanceThreshold) {
                continue;
            }

            double similarity = calculateTextSimilarity(
                    title + " " + description,
                    existing.title() + " " + existing.description());

            if (similarity >= textSimilarityThreshold) {
                log.warn("Potential duplicate detected! New incident matches existing {} (dist={}m, similarity={})",
                        existing.id(), Math.round(distanceMeters), similarity);
                return Optional.of(new DuplicateMatch(existing.id(), existing.title(), similarity, distanceMeters));
            }
        }

        return Optional.empty();
    }

    private List<IncidentDocument> fetchDuplicateCandidates(String category, double lat, double lon, Instant effectiveTime) throws Exception {
        Instant from = effectiveTime.minus(Duration.ofMinutes(timeWindowMinutes));
        Instant to = effectiveTime.plus(Duration.ofMinutes(timeWindowMinutes));

        Query query = Query.of(q -> q.bool(b -> b
                .filter(f -> f.term(t -> t.field("category").value(FieldValue.of(category.toUpperCase()))))
                .filter(f -> f.geoDistance(g -> g
                        .field("location")
                        .distance(maxDistanceThreshold + "m")
                        .location(loc -> loc.latlon(ll -> ll.lat(lat).lon(lon)))))
                .filter(f -> f.range(r -> r.field("created_at").gte(toJsonData(from)).lte(toJsonData(to))))));

        SearchResponse<IncidentDocument> response = openSearchClient.search(
                s -> s.index(indexName).size(50).query(query), IncidentDocument.class);

        return response.hits().hits().stream()
                .map(org.opensearch.client.opensearch.core.search.Hit::source)
                .filter(Objects::nonNull)
                .toList();
    }

    private static org.opensearch.client.json.JsonData toJsonData(Instant instant) {
        return org.opensearch.client.json.JsonData.of(instant.toString());
    }

    private double calculateTextSimilarity(String s1, String s2) {
        Set<String> set1 = new HashSet<>(Arrays.asList(s1.toLowerCase().replaceAll("[^a-z0-9 ]", "").split("\\s+")));
        Set<String> set2 = new HashSet<>(Arrays.asList(s2.toLowerCase().replaceAll("[^a-z0-9 ]", "").split("\\s+")));

        if (set1.isEmpty() || set2.isEmpty()) return 0.0;

        Set<String> intersection = new HashSet<>(set1);
        intersection.retainAll(set2);

        Set<String> union = new HashSet<>(set1);
        union.addAll(set2);

        return (double) intersection.size() / union.size(); // Jaccard index
    }

    private double calculateDistanceMeters(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return 6371000.0 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    public record DuplicateMatch(String originalIncidentId, String title, double similarityScore, double distanceMeters) {}
}
