package com.sentinelx.incident;

import com.sentinelx.common.dto.GeospatialLocationDto;
import com.sentinelx.common.dto.IncidentCreateRequest;
import com.sentinelx.common.dto.IncidentResponse;
import com.sentinelx.common.enums.IncidentCategory;
import com.sentinelx.common.enums.IncidentSeverity;
import com.sentinelx.incident.outbox.OutboxEventEntity;
import com.sentinelx.incident.outbox.OutboxEventRepository;
import com.sentinelx.incident.outbox.OutboxPublisher;
import com.sentinelx.incident.outbox.OutboxStatus;
import com.sentinelx.incident.repository.IncidentRepository;
import com.sentinelx.incident.service.IncidentService;
import org.apache.kafka.clients.consumer.Consumer;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.testcontainers.containers.KafkaContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Real integration test for the Transactional Outbox pattern (Section 6/28):
 * a genuine PostgreSQL container (Flyway-migrated for real, not H2) and a
 * genuine Kafka broker, both via Testcontainers -- no mocks for the two
 * systems this pattern actually depends on.
 *
 * Proves, against real infrastructure:
 *  1. Creating an incident atomically inserts both the `incidents` row and
 *     the `outbox_events` row in one transaction (queried back from the
 *     real DB after the call, not asserted against a mock).
 *  2. OutboxPublisher genuinely publishes the pending event to a real Kafka
 *     topic -- a real consumer on the real broker receives it -- and flips
 *     the outbox row's status to PUBLISHED in the real DB afterward.
 */
@SpringBootTest
@Testcontainers
class OutboxPostgresKafkaIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>(DockerImageName.parse("postgis/postgis:16-3.4-alpine").asCompatibleSubstituteFor("postgres"))
            .withDatabaseName("sentinelx_incident_test")
            .withUsername("test")
            .withPassword("test");

    @Container
    static final KafkaContainer KAFKA = new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.6.0"));

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("spring.kafka.bootstrap-servers", KAFKA::getBootstrapServers);
        // Real HTTP calls to ai-service/search-service (neither is running
        // in this test) intentionally aren't mocked -- IncidentService is
        // designed to degrade gracefully to Optional.empty() on connection
        // failure (Section 23), so pointing these at a closed port exercises
        // that real fallback path rather than skipping it.
        registry.add("ai-service.base-url", () -> "http://localhost:1");
        registry.add("search-service.base-url", () -> "http://localhost:1");
    }

    @Autowired
    IncidentService incidentService;

    @Autowired
    IncidentRepository incidentRepository;

    @Autowired
    OutboxEventRepository outboxEventRepository;

    @Autowired
    OutboxPublisher outboxPublisher;

    @Test
    void outboxRowCommitsAtomicallyWithIncidentRowInRealPostgres() {
        GeospatialLocationDto loc = new GeospatialLocationDto(37.7749, -122.4194, "Real DB Hall", "1", "ZONE-TEST", "1 Test Ave");
        IncidentCreateRequest req = new IncidentCreateRequest(
                "Testcontainers Integration Fire",
                "Verifying real transactional outbox atomicity against a real Postgres container",
                IncidentCategory.FIRE,
                IncidentSeverity.HIGH,
                loc,
                Collections.emptyList()
        );

        IncidentResponse created = incidentService.createIncident(req, "itest-user", "itest-key-" + System.nanoTime(), "itest-trace");

        assertNotNull(created.id());

        // Read back from the REAL database, not a mock -- proves the row
        // genuinely exists in Postgres after the transaction committed.
        assertTrue(incidentRepository.findById(created.id()).isPresent(),
                "incident row must exist in real Postgres after createIncident()");

        List<OutboxEventEntity> outboxRows = outboxEventRepository.findAll().stream()
                .filter(e -> e.getAggregateId().equals(created.id()))
                .toList();
        assertEquals(1, outboxRows.size(), "exactly one outbox_events row must have been committed atomically with the incident row");
        assertEquals("incident.created", outboxRows.get(0).getEventType());
        assertEquals(OutboxStatus.PENDING, outboxRows.get(0).getStatus());
        assertTrue(outboxRows.get(0).getPayload().contains(created.id()));
    }

    @Test
    void outboxPublisherActuallyPublishesToRealKafkaAndMarksRowPublished() throws Exception {
        GeospatialLocationDto loc = new GeospatialLocationDto(37.7750, -122.4180, "Kafka Test Hall", "2", "ZONE-TEST", "2 Test Ave");
        IncidentCreateRequest req = new IncidentCreateRequest(
                "Testcontainers Kafka Publish Check",
                "Verifying OutboxPublisher against a real Kafka broker",
                IncidentCategory.MEDICAL,
                IncidentSeverity.CRITICAL,
                loc,
                Collections.emptyList()
        );

        IncidentResponse created = incidentService.createIncident(req, "itest-user-2", "itest-key-2-" + System.nanoTime(), "itest-trace-2");

        // Drive the publisher synchronously instead of waiting on its
        // @Scheduled interval -- deterministic, same code path either way.
        outboxPublisher.publishPendingEvents();

        // A real consumer, on the real Testcontainers Kafka broker,
        // subscribed to the exact topic the publisher writes to.
        Properties consumerProps = new Properties();
        consumerProps.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, KAFKA.getBootstrapServers());
        consumerProps.put(ConsumerConfig.GROUP_ID_CONFIG, "itest-consumer-" + System.nanoTime());
        consumerProps.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        consumerProps.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
        consumerProps.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());

        boolean found = false;
        try (Consumer<String, String> consumer = new KafkaConsumer<>(consumerProps)) {
            consumer.subscribe(List.of("incident.created"));
            long deadline = System.currentTimeMillis() + 15_000;
            while (System.currentTimeMillis() < deadline && !found) {
                ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(500));
                for (ConsumerRecord<String, String> record : records) {
                    if (record.key().equals(created.id()) && record.value().contains(created.id())) {
                        found = true;
                        break;
                    }
                }
            }
        }

        assertTrue(found, "a real Kafka consumer must receive the incident.created event published by OutboxPublisher");

        // Eventually-consistent status flip -- poll since the publisher's
        // save() happens in an async Kafka send callback.
        long deadline = System.currentTimeMillis() + 10_000;
        OutboxStatus status = null;
        while (System.currentTimeMillis() < deadline) {
            status = outboxEventRepository.findAll().stream()
                    .filter(e -> e.getAggregateId().equals(created.id()))
                    .findFirst()
                    .map(OutboxEventEntity::getStatus)
                    .orElse(null);
            if (status == OutboxStatus.PUBLISHED) break;
            Thread.sleep(300);
        }
        assertEquals(OutboxStatus.PUBLISHED, status, "outbox row must be marked PUBLISHED in real Postgres after real Kafka send succeeds");
    }
}
