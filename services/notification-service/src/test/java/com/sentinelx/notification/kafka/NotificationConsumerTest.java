package com.sentinelx.notification.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.sentinelx.common.dto.GeospatialLocationDto;
import com.sentinelx.common.enums.IncidentCategory;
import com.sentinelx.common.enums.IncidentSeverity;
import com.sentinelx.common.enums.IncidentStatus;
import com.sentinelx.common.events.*;
import com.sentinelx.notification.service.NotificationDispatcher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Real unit tests for event-to-channel routing (Section 17): each Kafka
 * topic must dispatch through the correct channel with the correct real
 * content, and a malformed payload must propagate (not swallow) so the
 * consumer's retry/DLQ machinery (KafkaConsumerConfig) actually engages.
 */
class NotificationConsumerTest {

    private NotificationDispatcher dispatcher;
    private ObjectMapper objectMapper;
    private NotificationConsumer consumer;

    @BeforeEach
    void setUp() {
        dispatcher = mock(NotificationDispatcher.class);
        objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
        consumer = new NotificationConsumer(dispatcher, objectMapper);
    }

    @Test
    void onIncidentCreated_routesToPushChannelWithTitleAndSeverity() throws Exception {
        IncidentCreatedPayload payload = new IncidentCreatedPayload(
                "inc-1", "reporter-1", "Fire in East Wing", "Smoke visible",
                IncidentCategory.FIRE, IncidentSeverity.CRITICAL, IncidentStatus.REPORTED,
                new GeospatialLocationDto(37.7749, -122.4194, "East Wing", "3", "ZONE_EAST", "1 Campus Rd"),
                java.util.List.of(), "idem-1"
        );
        String json = objectMapper.writeValueAsString(new IncidentCreatedEventV1("inc-1", "trace-1", payload));

        consumer.onIncidentCreated(json);

        verify(dispatcher).dispatchPushAlert(
                eq("campus-emergency"),
                contains("Fire in East Wing"),
                contains("CRITICAL")
        );
        verify(dispatcher, never()).dispatchEmail(anyString(), anyString(), anyString());
        verify(dispatcher, never()).dispatchSms(anyString(), anyString());
    }

    @Test
    void onIncidentAssigned_routesToSmsChannelAddressedToTheResponder() throws Exception {
        IncidentAssignedPayload payload = new IncidentAssignedPayload(
                "inc-2", "resp-42", "Marcus Vance", 0.91, 120.0, Instant.now(), Instant.now().plusSeconds(120)
        );
        String json = objectMapper.writeValueAsString(new IncidentAssignedEventV1("inc-2", "trace-2", payload));

        consumer.onIncidentAssigned(json);

        verify(dispatcher).dispatchSms(eq("resp-42"), contains("inc-2"));
        verify(dispatcher, never()).dispatchEmail(anyString(), anyString(), anyString());
        verify(dispatcher, never()).dispatchPushAlert(anyString(), anyString(), anyString());
    }

    @Test
    void onSlaBreached_routesToEmailChannelAddressedToSupervisor() throws Exception {
        IncidentSlaEventPayload payload = new IncidentSlaEventPayload(
                "inc-3", IncidentSeverity.CRITICAL, "BREACHED", Instant.now(), 300, 120, 250.0
        );
        String json = objectMapper.writeValueAsString(new IncidentSlaBreachedEventV1("inc-3", "trace-3", payload));

        consumer.onSlaBreached(json);

        verify(dispatcher).dispatchEmail(eq("supervisor@sentinelx.local"), contains("inc-3"), contains("inc-3"));
        verify(dispatcher, never()).dispatchSms(anyString(), anyString());
        verify(dispatcher, never()).dispatchPushAlert(anyString(), anyString(), anyString());
    }

    @Test
    void onIncidentCreated_malformedJsonPropagatesInsteadOfBeingSwallowed() {
        // A consumer that silently swallows a bad message would never
        // retry or reach the DLQ -- the notification is just gone. This is
        // exactly what KafkaConsumerConfig's DefaultErrorHandler relies on
        // NOT happening.
        assertThrows(RuntimeException.class, () -> consumer.onIncidentCreated("{ this is not valid json"));
        verifyNoInteractions(dispatcher);
    }
}
