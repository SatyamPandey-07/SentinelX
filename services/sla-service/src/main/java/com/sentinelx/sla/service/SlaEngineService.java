package com.sentinelx.sla.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sentinelx.common.enums.IncidentSeverity;
import com.sentinelx.common.events.IncidentSlaBreachedEventV1;
import com.sentinelx.common.events.IncidentSlaEventPayload;
import com.sentinelx.common.events.IncidentSlaWarningEventV1;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;

/**
 * SLA Engine utilizing Redis Sorted Sets (ZSET) for efficient, low-overhead deadline scheduling.
 *
 * Architectural Tradeoff (Section 16):
 * Why NOT database polling?
 * Polling relational tables (SELECT * FROM incidents WHERE deadline < NOW()) produces table locks,
 * index contention, and CPU spikes that degrade the primary transactional write pipeline.
 *
 * Why Redis Sorted Sets?
 * Redis ZSET stores entries with double scores (epoch milliseconds). Range queries (ZRANGEBYSCORE)
 * execute in O(log(N) + M) time entirely in-memory. Deadlines can be evaluated every 1000ms
 * with zero impact on PostgreSQL.
 */
@Service
@EnableScheduling
public class SlaEngineService {

    private static final Logger log = LoggerFactory.getLogger(SlaEngineService.class);

    private static final String ZSET_DEADLINES = "sla:deadlines";
    private static final String ZSET_WARNINGS = "sla:warnings";
    private static final String KEY_META_PREFIX = "sla:meta:";

    private final StringRedisTemplate redisTemplate;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final double warningThresholdRatio;

    public SlaEngineService(
            StringRedisTemplate redisTemplate,
            KafkaTemplate<String, String> kafkaTemplate,
            ObjectMapper objectMapper,
            @Value("${sla.schedule.warning-threshold-ratio:0.80}") double warningThresholdRatio) {
        this.redisTemplate = redisTemplate;
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
        this.warningThresholdRatio = warningThresholdRatio;
    }

    public void scheduleSla(String incidentId, IncidentSeverity severity, Instant createdAt, Instant ackDeadline) {
        long startMs = createdAt.toEpochMilli();
        long deadlineMs = ackDeadline.toEpochMilli();
        long totalDurationMs = deadlineMs - startMs;
        long warningMs = startMs + (long) (totalDurationMs * warningThresholdRatio);

        // Store scores in Redis ZSets
        redisTemplate.opsForZSet().add(ZSET_DEADLINES, incidentId, deadlineMs);
        redisTemplate.opsForZSet().add(ZSET_WARNINGS, incidentId, warningMs);

        // Store SLA metadata
        SlaMetadata meta = new SlaMetadata(
                incidentId,
                severity != null ? severity.name() : "MEDIUM",
                createdAt.toString(),
                ackDeadline.toString(),
                totalDurationMs / 1000
        );

        try {
            redisTemplate.opsForValue().set(KEY_META_PREFIX + incidentId, objectMapper.writeValueAsString(meta), Duration.ofDays(2));
            log.info("Scheduled SLA timers for incidentId={} deadline={} warning={}", incidentId, ackDeadline, Instant.ofEpochMilli(warningMs));
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize SLA metadata for incidentId={}: {}", incidentId, e.getMessage());
        }
    }

    public void cancelSla(String incidentId) {
        redisTemplate.opsForZSet().remove(ZSET_DEADLINES, incidentId);
        redisTemplate.opsForZSet().remove(ZSET_WARNINGS, incidentId);
        redisTemplate.delete(KEY_META_PREFIX + incidentId);
        log.info("Canceled pending SLA timers for incidentId={}", incidentId);
    }

    @Scheduled(fixedDelayString = "${sla.schedule.poll-interval-ms:1000}")
    public void evaluateSlaSchedules() {
        long nowMs = System.currentTimeMillis();

        // 1. Evaluate Warnings (80% elapsed)
        Set<String> warningIncidents = redisTemplate.opsForZSet().rangeByScore(ZSET_WARNINGS, 0, nowMs);
        if (warningIncidents != null && !warningIncidents.isEmpty()) {
            for (String incidentId : warningIncidents) {
                publishSlaWarning(incidentId);
                // Remove from warnings ZSET so warning is published only once
                redisTemplate.opsForZSet().remove(ZSET_WARNINGS, incidentId);
            }
        }

        // 2. Evaluate Breaches (100% elapsed)
        Set<String> breachedIncidents = redisTemplate.opsForZSet().rangeByScore(ZSET_DEADLINES, 0, nowMs);
        if (breachedIncidents != null && !breachedIncidents.isEmpty()) {
            for (String incidentId : breachedIncidents) {
                publishSlaBreached(incidentId);
                // Remove from deadlines ZSET so breach is emitted only once
                redisTemplate.opsForZSet().remove(ZSET_DEADLINES, incidentId);
            }
        }
    }

    private void publishSlaWarning(String incidentId) {
        SlaMetadata meta = getMetadata(incidentId);
        IncidentSeverity severity = meta != null ? IncidentSeverity.valueOf(meta.severity()) : IncidentSeverity.MEDIUM;
        long allowedSec = meta != null ? meta.allowedSeconds() : 300;

        IncidentSlaEventPayload payload = new IncidentSlaEventPayload(
                incidentId,
                severity,
                "ACKNOWLEDGEMENT",
                meta != null ? Instant.parse(meta.deadline()) : Instant.now(),
                (long) (allowedSec * warningThresholdRatio),
                allowedSec,
                80.0
        );

        IncidentSlaWarningEventV1 event = new IncidentSlaWarningEventV1(incidentId, UUID.randomUUID().toString(), payload);
        publishToKafka(IncidentSlaWarningEventV1.EVENT_TYPE, incidentId, event);
        log.warn("SLA WARNING published for incidentId={} (80% threshold reached)", incidentId);
    }

    private void publishSlaBreached(String incidentId) {
        SlaMetadata meta = getMetadata(incidentId);
        IncidentSeverity severity = meta != null ? IncidentSeverity.valueOf(meta.severity()) : IncidentSeverity.MEDIUM;
        long allowedSec = meta != null ? meta.allowedSeconds() : 300;

        IncidentSlaEventPayload payload = new IncidentSlaEventPayload(
                incidentId,
                severity,
                "ACKNOWLEDGEMENT",
                meta != null ? Instant.parse(meta.deadline()) : Instant.now(),
                allowedSec,
                allowedSec,
                100.0
        );

        IncidentSlaBreachedEventV1 event = new IncidentSlaBreachedEventV1(incidentId, UUID.randomUUID().toString(), payload);
        publishToKafka(IncidentSlaBreachedEventV1.EVENT_TYPE, incidentId, event);
        log.error("SLA BREACHED published for incidentId={} (100% time exceeded)", incidentId);
    }

    private SlaMetadata getMetadata(String incidentId) {
        String json = redisTemplate.opsForValue().get(KEY_META_PREFIX + incidentId);
        if (json != null) {
            try {
                return objectMapper.readValue(json, SlaMetadata.class);
            } catch (JsonProcessingException e) {
                log.error("Failed to parse metadata for {}: {}", incidentId, e.getMessage());
            }
        }
        return null;
    }

    private void publishToKafka(String topic, String key, Object event) {
        try {
            String json = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(topic, key, json);
        } catch (JsonProcessingException e) {
            log.error("Failed to publish SLA event to topic {}: {}", topic, e.getMessage());
        }
    }

    public record SlaMetadata(String incidentId, String severity, String createdAt, String deadline, long allowedSeconds) {}
}
