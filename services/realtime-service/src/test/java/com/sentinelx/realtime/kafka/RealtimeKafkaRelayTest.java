package com.sentinelx.realtime.kafka;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

/**
 * Real unit tests for the Kafka-to-STOMP relay (Section 17): this is the
 * only thing standing between "an incident lifecycle event was published"
 * and "the dispatcher dashboard actually shows it" -- if a topic gets
 * routed to the wrong STOMP destination, every subscribed browser silently
 * stops receiving that category of update.
 */
class RealtimeKafkaRelayTest {

    private SimpMessagingTemplate messagingTemplate;
    private RealtimeKafkaRelay relay;

    @BeforeEach
    void setUp() {
        messagingTemplate = mock(SimpMessagingTemplate.class);
        relay = new RealtimeKafkaRelay(messagingTemplate);
    }

    @Test
    void onIncidentLifecycleEvent_relaysRawMessageVerbatimToIncidentsTopic() {
        String rawEvent = "{\"event_type\":\"incident.created\",\"aggregate_id\":\"inc-1\"}";

        relay.onIncidentLifecycleEvent(rawEvent);

        verify(messagingTemplate).convertAndSend(eq("/topic/incidents"), eq(rawEvent));
    }

    @Test
    void onSlaEvent_relaysRawMessageVerbatimToSlaTopic_notIncidentsTopic() {
        String rawEvent = "{\"event_type\":\"incident.sla.breached\",\"aggregate_id\":\"inc-2\"}";

        relay.onSlaEvent(rawEvent);

        verify(messagingTemplate).convertAndSend(eq("/topic/sla"), eq(rawEvent));
        verify(messagingTemplate, org.mockito.Mockito.never()).convertAndSend(eq("/topic/incidents"), org.mockito.ArgumentMatchers.anyString());
    }
}
