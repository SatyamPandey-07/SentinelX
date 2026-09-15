package com.sentinelx.assignment.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sentinelx.assignment.algorithm.ScoringEngine;
import com.sentinelx.assignment.grpc.LocationGrpcClient;
import com.sentinelx.common.enums.IncidentCategory;
import com.sentinelx.common.enums.IncidentSeverity;
import com.sentinelx.common.events.IncidentAssignedEventV1;
import com.sentinelx.common.events.IncidentAssignedPayload;
import com.sentinelx.proto.location.ResponderLocationInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;

@Service
public class AssignmentService {

    private static final Logger log = LoggerFactory.getLogger(AssignmentService.class);

    private final LocationGrpcClient locationGrpcClient;
    private final ScoringEngine scoringEngine;
    private final DistributedLockService distributedLockService;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public AssignmentService(
            LocationGrpcClient locationGrpcClient,
            ScoringEngine scoringEngine,
            DistributedLockService distributedLockService,
            KafkaTemplate<String, String> kafkaTemplate,
            ObjectMapper objectMapper) {
        this.locationGrpcClient = locationGrpcClient;
        this.scoringEngine = scoringEngine;
        this.distributedLockService = distributedLockService;
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    public void assignBestResponder(
            String incidentId,
            String traceId,
            double latitude,
            double longitude,
            IncidentCategory category,
            IncidentSeverity severity) {

        log.info("Evaluating responder candidates for incidentId={} severity={} category={}", incidentId, severity, category);

        // 1. Fetch nearest candidates via gRPC
        List<ResponderLocationInfo> candidates = locationGrpcClient.findNearestResponders(latitude, longitude, 10, null);

        if (candidates.isEmpty()) {
            log.error("No available responders found for incidentId={}", incidentId);
            return;
        }

        // 2. Score and rank candidates
        List<ScoredCandidate> scoredList = candidates.stream()
                .map(c -> {
                    double score = scoringEngine.calculateScore(
                            c.getDistanceMeters(),
                            c.getSkillsList(),
                            c.getActiveIncidentCount(),
                            category,
                            severity
                    );
                    return new ScoredCandidate(c, score);
                })
                .sorted(Comparator.comparingDouble(ScoredCandidate::score).reversed())
                .toList();

        // 3. Select best candidate with Redis Distributed Lock (prevents double assignment race condition)
        ResponderLocationInfo chosen = null;
        double winningScore = 0.0;

        for (ScoredCandidate sc : scoredList) {
            String responderId = sc.candidate().getResponderId();
            if (distributedLockService.tryAcquire(responderId, incidentId)) {
                chosen = sc.candidate();
                winningScore = sc.score();
                break;
            } else {
                log.warn("Responder {} locked by another incident, trying next ranked candidate", responderId);
            }
        }

        if (chosen == null) {
            log.error("All eligible responders are currently locked for incidentId={}", incidentId);
            return;
        }

        // 4. Calculate SLA Deadline (Section 16)
        Instant now = Instant.now();
        Instant ackDeadline = calculateSlaAckDeadline(now, severity);

        // 5. Publish incident.assigned event to Kafka
        IncidentAssignedPayload payload = new IncidentAssignedPayload(
                incidentId,
                chosen.getResponderId(),
                chosen.getResponderName(),
                winningScore,
                chosen.getDistanceMeters(),
                now,
                ackDeadline
        );

        IncidentAssignedEventV1 event = new IncidentAssignedEventV1(incidentId, traceId, payload);

        try {
            String json = objectMapper.writeValueAsString(event);
            // Partition key: incidentId ensures ordering
            kafkaTemplate.send(IncidentAssignedEventV1.EVENT_TYPE, incidentId, json);
            log.info("Assigned responder {} to incident {} with score={}",
                    chosen.getResponderId(), incidentId, winningScore);
        } catch (Exception e) {
            log.error("Failed to publish incident.assigned event: {}", e.getMessage(), e);
            distributedLockService.release(chosen.getResponderId(), incidentId);
        }
    }

    private Instant calculateSlaAckDeadline(Instant from, IncidentSeverity severity) {
        if (severity == null) severity = IncidentSeverity.MEDIUM;
        Duration duration = switch (severity) {
            case CRITICAL -> Duration.ofMinutes(2);
            case HIGH -> Duration.ofMinutes(5);
            case MEDIUM -> Duration.ofMinutes(15);
            case LOW -> Duration.ofMinutes(30);
        };
        return from.plus(duration);
    }

    private record ScoredCandidate(ResponderLocationInfo candidate, double score) {}
}
