package com.sentinelx.incident.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sentinelx.common.events.IncidentAssignedEventV1;
import com.sentinelx.common.events.IncidentAssignedPayload;
import com.sentinelx.incident.service.IncidentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class IncidentEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(IncidentEventConsumer.class);
    private static final String PROCESSED_EVENT_PREFIX = "processed:event:";

    private final IncidentService incidentService;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public IncidentEventConsumer(
            IncidentService incidentService,
            StringRedisTemplate redisTemplate,
            ObjectMapper objectMapper) {
        this.incidentService = incidentService;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Idempotent Kafka Consumer for incident.assigned events.
     * Guarantees that even under duplicate redeliveries, the assignment is processed exactly once.
     */
    @KafkaListener(topics = "incident.assigned", groupId = "incident-service-group")
    public void onIncidentAssigned(String message) {
        try {
            IncidentAssignedEventV1 event = objectMapper.readValue(message, IncidentAssignedEventV1.class);
            String eventId = event.getEventId();

            // Deduplication via Redis atomic SETNX (Section 7 & 8)
            Boolean isFirstTime = redisTemplate.opsForValue().setIfAbsent(
                    PROCESSED_EVENT_PREFIX + eventId,
                    "PROCESSED",
                    Duration.ofDays(7)
            );

            if (Boolean.FALSE.equals(isFirstTime)) {
                log.info("Duplicate event detected, discarding: eventId={}", eventId);
                return;
            }

            IncidentAssignedPayload payload = event.getPayload();
            incidentService.assignResponder(payload.incidentId(), payload.responderId(), payload.slaAckDeadline());
            log.info("Successfully updated incident {} assignment to responder {}", payload.incidentId(), payload.responderId());

        } catch (Exception e) {
            log.error("Error processing incident.assigned event: {}", e.getMessage(), e);
            throw new RuntimeException(e);
        }
    }
}
