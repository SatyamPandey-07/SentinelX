package com.sentinelx.assignment.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sentinelx.assignment.service.AssignmentService;
import com.sentinelx.common.events.IncidentClassifiedEventV1;
import com.sentinelx.common.events.IncidentCreatedEventV1;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class IncidentConsumer {

    private static final Logger log = LoggerFactory.getLogger(IncidentConsumer.class);
    private static final String DEDUP_PREFIX = "assignment:event:dedup:";

    private final AssignmentService assignmentService;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public IncidentConsumer(
            AssignmentService assignmentService,
            StringRedisTemplate redisTemplate,
            ObjectMapper objectMapper) {
        this.assignmentService = assignmentService;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "incident.created", groupId = "assignment-service-group")
    public void onIncidentCreated(String message) {
        try {
            IncidentCreatedEventV1 event = objectMapper.readValue(message, IncidentCreatedEventV1.class);
            String eventId = event.getEventId();

            Boolean isFirst = redisTemplate.opsForValue().setIfAbsent(DEDUP_PREFIX + eventId, "1", Duration.ofHours(24));
            if (Boolean.FALSE.equals(isFirst)) {
                log.info("Duplicate incident.created event, ignoring: {}", eventId);
                return;
            }

            var payload = event.getPayload();
            double lat = payload.location() != null ? payload.location().latitude() : 37.7749;
            double lon = payload.location() != null ? payload.location().longitude() : -122.4194;

            assignmentService.assignBestResponder(
                    payload.incidentId(),
                    event.getTraceId(),
                    lat,
                    lon,
                    payload.category(),
                    payload.severity()
            );

        } catch (Exception e) {
            log.error("Error processing incident.created for assignment: {}", e.getMessage(), e);
        }
    }
}
