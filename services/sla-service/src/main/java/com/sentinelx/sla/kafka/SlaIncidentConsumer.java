package com.sentinelx.sla.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sentinelx.common.events.IncidentAcknowledgedEventV1;
import com.sentinelx.common.events.IncidentAssignedEventV1;
import com.sentinelx.common.events.IncidentResolvedEventV1;
import com.sentinelx.sla.service.SlaEngineService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class SlaIncidentConsumer {

    private static final Logger log = LoggerFactory.getLogger(SlaIncidentConsumer.class);

    private final SlaEngineService slaEngineService;
    private final ObjectMapper objectMapper;

    public SlaIncidentConsumer(SlaEngineService slaEngineService, ObjectMapper objectMapper) {
        this.slaEngineService = slaEngineService;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "incident.assigned", groupId = "sla-service-group")
    public void onIncidentAssigned(String message) {
        try {
            IncidentAssignedEventV1 event = objectMapper.readValue(message, IncidentAssignedEventV1.class);
            var payload = event.getPayload();
            log.info("Registering SLA monitor for incidentId={} deadline={}", payload.incidentId(), payload.slaAckDeadline());

            slaEngineService.scheduleSla(
                    payload.incidentId(),
                    null,
                    payload.assignedAt() != null ? payload.assignedAt() : Instant.now(),
                    payload.slaAckDeadline()
            );
        } catch (Exception e) {
            log.error("Error processing incident.assigned for SLA: {}", e.getMessage(), e);
        }
    }

    @KafkaListener(topics = "incident.acknowledged", groupId = "sla-service-group")
    public void onIncidentAcknowledged(String message) {
        try {
            IncidentAcknowledgedEventV1 event = objectMapper.readValue(message, IncidentAcknowledgedEventV1.class);
            log.info("Incident {} acknowledged within SLA, cancelling timer", event.getAggregateId());
            slaEngineService.cancelSla(event.getAggregateId());
        } catch (Exception e) {
            log.error("Error processing incident.acknowledged for SLA: {}", e.getMessage(), e);
        }
    }

    @KafkaListener(topics = "incident.resolved", groupId = "sla-service-group")
    public void onIncidentResolved(String message) {
        try {
            IncidentResolvedEventV1 event = objectMapper.readValue(message, IncidentResolvedEventV1.class);
            log.info("Incident {} resolved, cancelling any active SLA timer", event.getAggregateId());
            slaEngineService.cancelSla(event.getAggregateId());
        } catch (Exception e) {
            log.error("Error processing incident.resolved for SLA: {}", e.getMessage(), e);
        }
    }
}
