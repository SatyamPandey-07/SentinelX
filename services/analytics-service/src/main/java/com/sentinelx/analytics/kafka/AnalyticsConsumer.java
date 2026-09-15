package com.sentinelx.analytics.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sentinelx.analytics.entity.IncidentMetricEntity;
import com.sentinelx.analytics.service.IncidentMetricRepository;
import com.sentinelx.common.events.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;

@Component
public class AnalyticsConsumer {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsConsumer.class);
    private static final String CACHE_KEY = "cache:analytics:overview";

    private final IncidentMetricRepository metricRepository;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public AnalyticsConsumer(
            IncidentMetricRepository metricRepository,
            StringRedisTemplate redisTemplate,
            ObjectMapper objectMapper) {
        this.metricRepository = metricRepository;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "incident.created", groupId = "analytics-service-group")
    public void onIncidentCreated(String message) {
        try {
            IncidentCreatedEventV1 event = objectMapper.readValue(message, IncidentCreatedEventV1.class);
            var p = event.getPayload();
            IncidentMetricEntity entity = new IncidentMetricEntity(
                    p.incidentId(),
                    p.category().name(),
                    p.severity().name(),
                    p.status().name(),
                    event.getTimestamp() != null ? event.getTimestamp() : Instant.now()
            );
            metricRepository.save(entity);
            redisTemplate.delete(CACHE_KEY);
        } catch (Exception e) {
            log.error("Error updating analytics on incident.created: {}", e.getMessage(), e);
        }
    }

    @KafkaListener(topics = "incident.acknowledged", groupId = "analytics-service-group")
    public void onIncidentAcknowledged(String message) {
        try {
            IncidentAcknowledgedEventV1 event = objectMapper.readValue(message, IncidentAcknowledgedEventV1.class);
            var p = event.getPayload();
            metricRepository.findById(p.incidentId()).ifPresent(metric -> {
                metric.setAcknowledgedAt(p.acknowledgedAt());
                metric.setStatus("ACKNOWLEDGED");
                metric.setResponseTimeSeconds(p.responseLatencySeconds());
                metricRepository.save(metric);
                redisTemplate.delete(CACHE_KEY);
            });
        } catch (Exception e) {
            log.error("Error updating analytics on incident.acknowledged: {}", e.getMessage(), e);
        }
    }

    @KafkaListener(topics = "incident.resolved", groupId = "analytics-service-group")
    public void onIncidentResolved(String message) {
        try {
            IncidentResolvedEventV1 event = objectMapper.readValue(message, IncidentResolvedEventV1.class);
            var p = event.getPayload();
            metricRepository.findById(p.incidentId()).ifPresent(metric -> {
                metric.setResolvedAt(p.resolvedAt());
                metric.setStatus("RESOLVED");
                metric.setResolutionTimeSeconds(p.totalDurationSeconds());
                metricRepository.save(metric);
                redisTemplate.delete(CACHE_KEY);
            });
        } catch (Exception e) {
            log.error("Error updating analytics on incident.resolved: {}", e.getMessage(), e);
        }
    }

    @KafkaListener(topics = "incident.sla.breached", groupId = "analytics-service-group")
    public void onSlaBreached(String message) {
        try {
            IncidentSlaBreachedEventV1 event = objectMapper.readValue(message, IncidentSlaBreachedEventV1.class);
            metricRepository.findById(event.getAggregateId()).ifPresent(metric -> {
                metric.setSlaBreached(true);
                metricRepository.save(metric);
                redisTemplate.delete(CACHE_KEY);
            });
        } catch (Exception e) {
            log.error("Error updating analytics on incident.sla.breached: {}", e.getMessage(), e);
        }
    }
}
