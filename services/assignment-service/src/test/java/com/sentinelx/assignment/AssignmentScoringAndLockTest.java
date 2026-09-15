package com.sentinelx.assignment;

import com.sentinelx.assignment.algorithm.ScoringEngine;
import com.sentinelx.assignment.service.DistributedLockService;
import com.sentinelx.common.enums.IncidentCategory;
import com.sentinelx.common.enums.IncidentSeverity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AssignmentScoringAndLockTest {

    private ScoringEngine scoringEngine;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    private DistributedLockService distributedLockService;

    @BeforeEach
    void setUp() {
        scoringEngine = new ScoringEngine(0.45, 0.35, 0.20);
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        distributedLockService = new DistributedLockService(redisTemplate, 10);
    }

    @Test
    void testScoringPrefersNearestSpecializedFireResponder() {
        // Candidate A: 300m away, FIRE skill, 0 active incidents
        double scoreA = scoringEngine.calculateScore(
                300.0,
                List.of("FIRE", "HAZMAT"),
                0,
                IncidentCategory.FIRE,
                IncidentSeverity.CRITICAL
        );

        // Candidate B: 1200m away, MEDICAL skill, 2 active incidents
        double scoreB = scoringEngine.calculateScore(
                1200.0,
                List.of("MEDICAL"),
                2,
                IncidentCategory.FIRE,
                IncidentSeverity.CRITICAL
        );

        assertTrue(scoreA > scoreB, "Closer specialized responder should score significantly higher than distant mismatched responder");
        assertTrue(scoreA > 80.0, "Candidate A should achieve high suitability score");
    }

    @Test
    void testDistributedLockAcquisitionAndRejection() {
        // First acquisition succeeds
        when(valueOperations.setIfAbsent(eq("lock:responder:resp-01"), eq("inc-100"), any(Duration.class)))
                .thenReturn(true);

        boolean acquired1 = distributedLockService.tryAcquire("resp-01", "inc-100");
        assertTrue(acquired1, "First incident should acquire lock on responder");

        // Concurrent acquisition attempt by another incident fails
        when(valueOperations.setIfAbsent(eq("lock:responder:resp-01"), eq("inc-200"), any(Duration.class)))
                .thenReturn(false);
        when(valueOperations.get("lock:responder:resp-01")).thenReturn("inc-100");

        boolean acquired2 = distributedLockService.tryAcquire("resp-01", "inc-200");
        assertFalse(acquired2, "Second incident should be rejected by distributed lock");
    }
}
