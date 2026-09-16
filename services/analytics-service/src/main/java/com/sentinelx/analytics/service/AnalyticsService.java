package com.sentinelx.analytics.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sentinelx.analytics.entity.IncidentMetricEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;

@Service
public class AnalyticsService {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsService.class);
    private static final String CACHE_KEY = "cache:analytics:overview";

    private final IncidentMetricRepository metricRepository;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public AnalyticsService(
            IncidentMetricRepository metricRepository,
            StringRedisTemplate redisTemplate,
            ObjectMapper objectMapper) {
        this.metricRepository = metricRepository;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> getAnalyticsOverview() {
        // Check Redis cache first (Section 20 requirement: avoid pounding transactional SQL)
        String cached = redisTemplate.opsForValue().get(CACHE_KEY);
        if (cached != null) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> map = objectMapper.readValue(cached, Map.class);
                return map;
            } catch (JsonProcessingException e) {
                log.warn("Failed to parse cached analytics: {}", e.getMessage());
            }
        }

        List<IncidentMetricEntity> all = metricRepository.findAll();
        long totalIncidents = all.size();
        long breachedCount = metricRepository.countBySlaBreached(true);

        double slaCompliance = totalIncidents > 0
                ? ((double) (totalIncidents - breachedCount) / totalIncidents) * 100.0
                : 100.0;

        List<Long> responseTimes = metricRepository.findAllResponseTimes();
        LatencyStats responseStats = calculateLatencyStats(responseTimes);

        List<Long> resolutionTimes = metricRepository.findAllResolutionTimes();
        LatencyStats resolutionStats = calculateLatencyStats(resolutionTimes);

        Map<String, Long> byCategory = new HashMap<>();
        Map<String, Long> bySeverity = new HashMap<>();
        Map<String, Long> byStatus = new HashMap<>();

        for (IncidentMetricEntity m : all) {
            byCategory.put(m.getCategory(), byCategory.getOrDefault(m.getCategory(), 0L) + 1);
            bySeverity.put(m.getSeverity(), bySeverity.getOrDefault(m.getSeverity(), 0L) + 1);
            byStatus.put(m.getStatus(), byStatus.getOrDefault(m.getStatus(), 0L) + 1);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("total_incidents", totalIncidents);
        result.put("sla_breached_count", breachedCount);
        result.put("sla_compliance_percent", Math.round(slaCompliance * 10.0) / 10.0);
        result.put("response_time_seconds", responseStats);
        result.put("resolution_time_seconds", resolutionStats);
        result.put("by_category", byCategory);
        result.put("by_severity", bySeverity);
        result.put("by_status", byStatus);

        // Cache in Redis with 60s TTL
        try {
            redisTemplate.opsForValue().set(CACHE_KEY, objectMapper.writeValueAsString(result), Duration.ofSeconds(60));
        } catch (JsonProcessingException e) {
            log.error("Failed to cache analytics overview: {}", e.getMessage());
        }

        return result;
    }

    // Package-private rather than private so AnalyticsServiceTest can
    // exercise the percentile math directly with known inputs, instead of
    // only indirectly through a fully mocked repository.
    LatencyStats calculateLatencyStats(List<Long> values) {
        if (values.isEmpty()) {
            return new LatencyStats(0.0, 0.0, 0.0);
        }

        double sum = 0.0;
        for (Long v : values) sum += v;
        double avg = sum / values.size();

        // Median
        int mid = values.size() / 2;
        double median = values.size() % 2 == 1
                ? values.get(mid)
                : (values.get(mid - 1) + values.get(mid)) / 2.0;

        // P95 percentile calculation
        int p95Index = (int) Math.ceil(0.95 * values.size()) - 1;
        p95Index = Math.max(0, Math.min(values.size() - 1, p95Index));
        double p95 = values.get(p95Index);

        return new LatencyStats(
                Math.round(avg * 10.0) / 10.0,
                Math.round(median * 10.0) / 10.0,
                Math.round(p95 * 10.0) / 10.0
        );
    }

    public record LatencyStats(double average, double median, double p95) {}
}
