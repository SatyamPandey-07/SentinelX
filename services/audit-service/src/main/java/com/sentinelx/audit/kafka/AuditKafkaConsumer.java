package com.sentinelx.audit.kafka;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sentinelx.audit.service.AuditService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class AuditKafkaConsumer {

    private static final Logger log = LoggerFactory.getLogger(AuditKafkaConsumer.class);

    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    public AuditKafkaConsumer(AuditService auditService, ObjectMapper objectMapper) {
        this.auditService = auditService;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = {"incident.created", "incident.assigned", "incident.acknowledged", "incident.resolved", "incident.sla.breached"},
                   groupId = "audit-service-group")
    public void onEvent(String message) {
        try {
            JsonNode root = objectMapper.readTree(message);
            String eventType = root.path("event_type").asText("UNKNOWN");
            String aggregateId = root.path("aggregate_id").asText("UNKNOWN");
            String traceId = root.path("trace_id").asText("");

            auditService.recordEvent(
                    "SYSTEM_KAFKA",
                    "SYSTEM",
                    eventType,
                    "Incident",
                    aggregateId,
                    message,
                    Instant.now()
            );
        } catch (Exception e) {
            log.error("Failed to parse and record audit log for Kafka message: {}", e.getMessage(), e);
        }
    }
}
