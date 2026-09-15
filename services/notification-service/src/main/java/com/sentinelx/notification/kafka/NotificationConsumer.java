package com.sentinelx.notification.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sentinelx.common.events.IncidentAssignedEventV1;
import com.sentinelx.common.events.IncidentCreatedEventV1;
import com.sentinelx.common.events.IncidentSlaBreachedEventV1;
import com.sentinelx.notification.service.NotificationDispatcher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class NotificationConsumer {

    private static final Logger log = LoggerFactory.getLogger(NotificationConsumer.class);

    private final NotificationDispatcher notificationDispatcher;
    private final ObjectMapper objectMapper;

    public NotificationConsumer(NotificationDispatcher notificationDispatcher, ObjectMapper objectMapper) {
        this.notificationDispatcher = notificationDispatcher;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "incident.created", groupId = "notification-service-group")
    public void onIncidentCreated(String message) {
        try {
            IncidentCreatedEventV1 event = objectMapper.readValue(message, IncidentCreatedEventV1.class);
            var p = event.getPayload();
            notificationDispatcher.dispatchPushAlert(
                    "campus-emergency",
                    "NEW INCIDENT: " + p.title(),
                    "Severity: " + p.severity() + " | Category: " + p.category()
            );
        } catch (Exception e) {
            log.error("Error processing incident.created notification: {}", e.getMessage(), e);
            throw new RuntimeException(e);
        }
    }

    @KafkaListener(topics = "incident.assigned", groupId = "notification-service-group")
    public void onIncidentAssigned(String message) {
        try {
            IncidentAssignedEventV1 event = objectMapper.readValue(message, IncidentAssignedEventV1.class);
            var p = event.getPayload();
            notificationDispatcher.dispatchSms(
                    p.responderId(),
                    "DISPATCH ORDER: You are assigned to incident " + p.incidentId() + ". Acknowledge immediately."
            );
        } catch (Exception e) {
            log.error("Error processing incident.assigned notification: {}", e.getMessage(), e);
            throw new RuntimeException(e);
        }
    }

    @KafkaListener(topics = "incident.sla.breached", groupId = "notification-service-group")
    public void onSlaBreached(String message) {
        try {
            IncidentSlaBreachedEventV1 event = objectMapper.readValue(message, IncidentSlaBreachedEventV1.class);
            notificationDispatcher.dispatchEmail(
                    "supervisor@sentinelx.local",
                    "URGENT: SLA BREACHED on Incident " + event.getAggregateId(),
                    "Incident " + event.getAggregateId() + " has exceeded allowed response deadline!"
            );
        } catch (Exception e) {
            log.error("Error processing incident.sla.breached notification: {}", e.getMessage(), e);
            throw new RuntimeException(e);
        }
    }
}
