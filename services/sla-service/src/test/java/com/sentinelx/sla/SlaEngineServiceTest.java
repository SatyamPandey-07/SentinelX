package com.sentinelx.sla;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sentinelx.common.enums.IncidentSeverity;
import com.sentinelx.sla.service.SlaEngineService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.kafka.core.KafkaTemplate;

import java.time.Duration;
import java.time.Instant;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SlaEngineServiceTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ZSetOperations<String, String> zSetOperations;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @Mock
    private KafkaTemplate<String, String> kafkaTemplate;

    private ObjectMapper objectMapper;
    private SlaEngineService slaEngineService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        lenient().when(redisTemplate.opsForZSet()).thenReturn(zSetOperations);
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        slaEngineService = new SlaEngineService(redisTemplate, kafkaTemplate, objectMapper, 0.80);
    }

    @Test
    void testScheduleSlaRegistersScoresInRedisZSets() {
        Instant now = Instant.now();
        Instant deadline = now.plus(Duration.ofMinutes(5)); // 300 seconds

        slaEngineService.scheduleSla("inc-123", IncidentSeverity.HIGH, now, deadline);

        // Verify deadline is scheduled at 100% (300s)
        verify(zSetOperations).add(eq("sla:deadlines"), eq("inc-123"), eq((double) deadline.toEpochMilli()));

        // Verify warning is scheduled at 80% (240s)
        long expectedWarningMs = now.toEpochMilli() + (long) (Duration.ofMinutes(5).toMillis() * 0.80);
        verify(zSetOperations).add(eq("sla:warnings"), eq("inc-123"), eq((double) expectedWarningMs));
    }

    @Test
    void testCancelSlaRemovesTimersFromZSets() {
        slaEngineService.cancelSla("inc-123");

        verify(zSetOperations).remove("sla:deadlines", "inc-123");
        verify(zSetOperations).remove("sla:warnings", "inc-123");
        verify(redisTemplate).delete("sla:meta:inc-123");
    }
}
