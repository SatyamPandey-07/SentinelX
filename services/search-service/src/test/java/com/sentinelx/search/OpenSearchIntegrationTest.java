package com.sentinelx.search;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.sentinelx.search.model.IncidentDocument;
import com.sentinelx.search.service.SearchIndexService;
import org.apache.hc.core5.http.HttpHost;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.opensearch.client.json.jackson.JacksonJsonpMapper;
import org.opensearch.client.opensearch.OpenSearchClient;
import org.opensearch.client.transport.OpenSearchTransport;
import org.opensearch.client.transport.httpclient5.ApacheHttpClient5TransportBuilder;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;
import org.testcontainers.containers.wait.strategy.Wait;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Real integration test against a genuine OpenSearch container (Section
 * 10/28) -- not the in-memory fallback SearchIndexService uses when
 * OpenSearch is unreachable (that path is what DuplicateDetectionTest
 * already covers as a plain unit test). This proves the actual OpenSearch
 * query DSL calls (geo_distance filter, multi_match, range) work against
 * a real cluster, using the exact scenario from the spec:
 *
 *   "If five users report 'Smoke coming from chemistry laboratory' within
 *   100 meters and 5 minutes, the system should detect potential
 *   duplication."
 */
@Testcontainers
class OpenSearchIntegrationTest {

    @Container
    static final GenericContainer<?> OPENSEARCH = new GenericContainer<>(DockerImageName.parse("opensearchproject/opensearch:2.11.1"))
            .withEnv("discovery.type", "single-node")
            .withEnv("DISABLE_SECURITY_PLUGIN", "true")
            .withEnv("OPENSEARCH_JAVA_OPTS", "-Xms512m -Xmx512m")
            .withExposedPorts(9200)
            .waitingFor(Wait.forHttp("/_cluster/health").forStatusCode(200).withStartupTimeout(Duration.ofMinutes(2)));

    private SearchIndexService searchIndexService;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        HttpHost httpHost = new HttpHost("http", OPENSEARCH.getHost(), OPENSEARCH.getMappedPort(9200));
        OpenSearchTransport transport = ApacheHttpClient5TransportBuilder.builder(httpHost)
                .setMapper(new JacksonJsonpMapper(objectMapper))
                .build();
        OpenSearchClient client = new OpenSearchClient(transport);

        searchIndexService = new SearchIndexService(client, "itest-incidents-" + System.nanoTime(), 150.0, 10, 0.70);
    }

    @Test
    void fullTextSearchFindsIndexedIncidentInRealOpenSearch() throws InterruptedException {
        IncidentDocument doc = new IncidentDocument(
                "doc-1", "reporter-1", "Fire in the East Wing", "Smoke visible from the third floor stairwell",
                "FIRE", "HIGH", "REPORTED", null,
                new IncidentDocument.GeoLocation(37.7749, -122.4194),
                "East Wing", "3", "ZONE_EAST", "1 Campus Rd", Instant.now()
        );
        searchIndexService.indexIncident(doc);
        waitForIndexRefresh();

        List<IncidentDocument> results = searchIndexService.searchIncidents("smoke stairwell", null, null, null, null, null);

        assertFalse(results.isEmpty(), "real OpenSearch full-text query must find the indexed document");
        assertEquals("doc-1", results.get(0).id());
    }

    @Test
    void detectsDuplicateWhenFiveReportsClusterWithin100mAnd5MinInRealOpenSearch() throws InterruptedException {
        Instant now = Instant.now();
        // The original report.
        searchIndexService.indexIncident(new IncidentDocument(
                "orig", "r1", "Smoke coming from chemistry laboratory", "Strong smell of smoke near the chem lab entrance",
                "FIRE", "HIGH", "REPORTED", null,
                new IncidentDocument.GeoLocation(37.77490, -122.41940), "Chem Building", "1", "ZONE_NORTH", "addr", now
        ));
        // Three more near-duplicate reports, each within 100m / 5min / same wording family.
        for (int i = 0; i < 3; i++) {
            searchIndexService.indexIncident(new IncidentDocument(
                    "dup-" + i, "r" + (i + 2), "Smoke coming from chemistry laboratory", "Strong smell of smoke near the chem lab entrance",
                    "FIRE", "HIGH", "REPORTED", null,
                    // ~20-40m offsets, well within the 150m threshold
                    new IncidentDocument.GeoLocation(37.77490 + 0.0002 * i, -122.41940), "Chem Building", "1", "ZONE_NORTH", "addr",
                    now.plusSeconds(30L * i)
            ));
        }
        waitForIndexRefresh();

        // The fifth report arrives -- must be flagged as a likely duplicate of the original.
        Optional<SearchIndexService.DuplicateMatch> match = searchIndexService.detectPotentialDuplicate(
                "Smoke coming from chemistry laboratory",
                "Strong smell of smoke near the chem lab entrance",
                "FIRE",
                37.77495, -122.41935,
                now.plusSeconds(90)
        );

        assertTrue(match.isPresent(), "real OpenSearch geo_distance + range query must surface the clustered near-duplicate reports");
        assertTrue(match.get().similarityScore() >= 0.70);
        assertTrue(match.get().distanceMeters() < 150.0);
    }

    @Test
    void doesNotFlagDuplicateWhenOutsideDistanceThresholdInRealOpenSearch() throws InterruptedException {
        Instant now = Instant.now();
        searchIndexService.indexIncident(new IncidentDocument(
                "far-away", "r1", "Smoke coming from chemistry laboratory", "Strong smell of smoke near the chem lab entrance",
                "FIRE", "HIGH", "REPORTED", null,
                new IncidentDocument.GeoLocation(37.77490, -122.41940), "Chem Building", "1", "ZONE_NORTH", "addr", now
        ));
        waitForIndexRefresh();

        // ~1km away -- same text, same category, same time window, but well outside the 150m radius.
        Optional<SearchIndexService.DuplicateMatch> match = searchIndexService.detectPotentialDuplicate(
                "Smoke coming from chemistry laboratory",
                "Strong smell of smoke near the chem lab entrance",
                "FIRE",
                37.7840, -122.4194,
                now.plusSeconds(60)
        );

        assertTrue(match.isEmpty(), "a report 1km away must not be flagged as a duplicate even with identical text");
    }

    private static void waitForIndexRefresh() throws InterruptedException {
        // OpenSearch's default refresh_interval is 1s -- a document isn't
        // guaranteed searchable immediately after indexing.
        Thread.sleep(1500);
    }
}
