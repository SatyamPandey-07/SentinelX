package com.sentinelx.realtime.kafka;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class RealtimeKafkaRelay {

    private static final Logger log = LoggerFactory.getLogger(RealtimeKafkaRelay.class);

    private final SimpMessagingTemplate messagingTemplate;

    public RealtimeKafkaRelay(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @KafkaListener(topics = {"incident.created", "incident.assigned", "incident.acknowledged", "incident.resolved"},
                   groupId = "realtime-service-group")
    public void onIncidentLifecycleEvent(String message) {
        log.info("Broadcasting incident lifecycle update to /topic/incidents: {}", message);
        messagingTemplate.convertAndSend("/topic/incidents", message);
    }

    @KafkaListener(topics = {"incident.sla.warning", "incident.sla.breached"},
                   groupId = "realtime-service-sla-group")
    public void onSlaEvent(String message) {
        log.warn("Broadcasting SLA alert update to /topic/sla: {}", message);
        messagingTemplate.convertAndSend("/topic/sla", message);
    }
}
