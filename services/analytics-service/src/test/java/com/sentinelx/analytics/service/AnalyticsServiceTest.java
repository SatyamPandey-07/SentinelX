package com.sentinelx.analytics.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sentinelx.analytics.entity.IncidentMetricEntity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Real unit tests for the P95/median/average percentile math and SLA
 * compliance calculation (Section 20) -- the actual business logic this
 * service exists for, not a Spring context smoke test.
 */
class AnalyticsServiceTest {

    private IncidentMetricRepository repository;
    private StringRedisTemplate redisTemplate;
    private ValueOperations<String, String> valueOps;
    private AnalyticsService analyticsService;

    @BeforeEach
    void setUp() {
        repository = mock(IncidentMetricRepository.class);
        redisTemplate = mock(StringRedisTemplate.class);
        valueOps = mock(ValueOperations.class);
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        analyticsService = new AnalyticsService(repository, redisTemplate, new ObjectMapper());
    }

    @Test
    void calculateLatencyStats_oddCountUsesMiddleValueAsMedian() {
        var stats = analyticsService.calculateLatencyStats(List.of(10L, 20L, 30L, 40L, 50L));

        assertEquals(30.0, stats.median());
        assertEquals(30.0, stats.average());
    }

    @Test
    void calculateLatencyStats_evenCountAveragesTheTwoMiddleValues() {
        var stats = analyticsService.calculateLatencyStats(List.of(10L, 20L, 30L, 40L));

        // median of {10,20,30,40} = (20+30)/2 = 25.0
        assertEquals(25.0, stats.median());
        assertEquals(25.0, stats.average());
    }

    @Test
    void calculateLatencyStats_p95IsTheHighEndOfTheSortedDistribution() {
        // 20 ascending values 1..20 -- p95 index = ceil(0.95*20)-1 = 18 (0-based) -> value 19
        List<Long> values = java.util.stream.LongStream.rangeClosed(1, 20).boxed().toList();

        var stats = analyticsService.calculateLatencyStats(values);

        assertEquals(19.0, stats.p95());
    }

    @Test
    void calculateLatencyStats_emptyInputReturnsZeroesInsteadOfThrowing() {
        var stats = analyticsService.calculateLatencyStats(List.of());

        assertEquals(0.0, stats.average());
        assertEquals(0.0, stats.median());
        assertEquals(0.0, stats.p95());
    }

    @Test
    void getAnalyticsOverview_computesSlaCompliancePercentFromBreachedRatio() {
        when(valueOps.get(anyString())).thenReturn(null); // cache miss
        IncidentMetricEntity a = metric("a", "FIRE", "HIGH", "RESOLVED", false);
        IncidentMetricEntity b = metric("b", "MEDICAL", "CRITICAL", "RESOLVED", true);
        when(repository.findAll()).thenReturn(List.of(a, b));
        when(repository.countBySlaBreached(true)).thenReturn(1L);
        when(repository.findAllResponseTimes()).thenReturn(List.of(60L, 120L));
        when(repository.findAllResolutionTimes()).thenReturn(List.of(600L));

        Map<String, Object> overview = analyticsService.getAnalyticsOverview();

        assertEquals(2L, overview.get("total_incidents"));
        assertEquals(1L, overview.get("sla_breached_count"));
        // 1 of 2 breached -> 50.0% compliance
        assertEquals(50.0, overview.get("sla_compliance_percent"));
        @SuppressWarnings("unchecked")
        Map<String, Long> byCategory = (Map<String, Long>) overview.get("by_category");
        assertEquals(1L, byCategory.get("FIRE"));
        assertEquals(1L, byCategory.get("MEDICAL"));
    }

    @Test
    void getAnalyticsOverview_zeroIncidentsMeansFullCompliance() {
        when(valueOps.get(anyString())).thenReturn(null);
        when(repository.findAll()).thenReturn(List.of());
        when(repository.countBySlaBreached(true)).thenReturn(0L);
        when(repository.findAllResponseTimes()).thenReturn(List.of());
        when(repository.findAllResolutionTimes()).thenReturn(List.of());

        Map<String, Object> overview = analyticsService.getAnalyticsOverview();

        // No incidents means nothing breached -- compliance defaults to 100%,
        // not a divide-by-zero NaN/exception.
        assertEquals(100.0, overview.get("sla_compliance_percent"));
    }

    @Test
    void getAnalyticsOverview_cacheHitSkipsRepositoryEntirely() throws Exception {
        String cachedJson = new ObjectMapper().writeValueAsString(Map.of("total_incidents", 999));
        when(valueOps.get(anyString())).thenReturn(cachedJson);

        Map<String, Object> overview = analyticsService.getAnalyticsOverview();

        assertEquals(999, overview.get("total_incidents"));
        verifyNoInteractions(repository);
    }

    private static IncidentMetricEntity metric(String id, String category, String severity, String status, boolean breached) {
        IncidentMetricEntity m = new IncidentMetricEntity(id, category, severity, status, Instant.now());
        m.setSlaBreached(breached);
        return m;
    }
}
