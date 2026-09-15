package com.sentinelx.incident.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sentinelx.common.dto.GeospatialLocationDto;
import com.sentinelx.common.dto.IncidentCreateRequest;
import com.sentinelx.common.dto.IncidentResponse;
import com.sentinelx.common.enums.IncidentCategory;
import com.sentinelx.common.enums.IncidentSeverity;
import com.sentinelx.common.enums.IncidentStatus;
import com.sentinelx.common.events.*;
import com.sentinelx.incident.client.AiClassificationClient;
import com.sentinelx.incident.client.DuplicateCheckClient;
import com.sentinelx.incident.entity.IncidentEntity;
import com.sentinelx.incident.entity.IncidentLocationEntity;
import com.sentinelx.incident.outbox.OutboxEventEntity;
import com.sentinelx.incident.outbox.OutboxEventRepository;
import com.sentinelx.incident.repository.IncidentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
public class IncidentService {

    private static final Logger log = LoggerFactory.getLogger(IncidentService.class);
    private static final String CACHE_KEY_PREFIX = "cache:incident:";
    private static final String IDEMPOTENCY_KEY_PREFIX = "idempotency:incident:";

    private final IncidentRepository incidentRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final AiClassificationClient aiClassificationClient;
    private final DuplicateCheckClient duplicateCheckClient;

    public IncidentService(
            IncidentRepository incidentRepository,
            OutboxEventRepository outboxEventRepository,
            StringRedisTemplate redisTemplate,
            ObjectMapper objectMapper,
            AiClassificationClient aiClassificationClient,
            DuplicateCheckClient duplicateCheckClient) {
        this.incidentRepository = incidentRepository;
        this.outboxEventRepository = outboxEventRepository;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.aiClassificationClient = aiClassificationClient;
        this.duplicateCheckClient = duplicateCheckClient;
    }

    @Transactional
    public IncidentResponse createIncident(IncidentCreateRequest request, String reporterId, String idempotencyKey, String traceId) {
        // Idempotency Check via Redis (Section 42)
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            String cachedResponseJson = redisTemplate.opsForValue().get(IDEMPOTENCY_KEY_PREFIX + idempotencyKey);
            if (cachedResponseJson != null) {
                log.info("Idempotent request intercepted for key={}", idempotencyKey);
                try {
                    return objectMapper.readValue(cachedResponseJson, IncidentResponse.class);
                } catch (JsonProcessingException e) {
                    log.error("Failed to deserialize cached idempotency response: {}", e.getMessage());
                }
            }
        }

        // 1. AI Classification (Section 1 items 4-5). Reporter-supplied
        // category/severity are the fallback, used verbatim if AI is
        // unavailable or its opinion doesn't map to a valid enum — see
        // AiClassificationClient for the full failure-handling contract.
        IncidentCategory finalCategory = request.category();
        IncidentSeverity finalSeverity = request.severity() != null ? request.severity() : IncidentSeverity.MEDIUM;

        var classification = aiClassificationClient.classify(request.title(), request.description(), request.category());
        if (classification.isPresent()) {
            finalCategory = classification.get().category();
            finalSeverity = classification.get().severity();
            log.info("AI classified incident as category={} severity={} confidence={} safetyRuleApplied={}",
                    finalCategory, finalSeverity, classification.get().confidence(), classification.get().safetyRuleApplied());
        }

        // 2. Duplicate Detection (Section 1 item 6, Section 10). Logged
        // only — never blocks creation, see DuplicateCheckClient javadoc.
        if (request.location() != null) {
            duplicateCheckClient.checkDuplicate(
                    request.title(), request.description(), finalCategory,
                    request.location().latitude(), request.location().longitude()
            ).ifPresent(dup -> log.warn(
                    "Potential duplicate of incident {} detected (similarity={}, distance={}m) — creating anyway; "
                            + "emergency reporting is never blocked on a duplicate-detection signal",
                    dup.originalIncidentId(), dup.similarityScore(), dup.distanceMeters()));
        }

        // 3. Create Incident Aggregate
        IncidentEntity incident = new IncidentEntity(
                reporterId,
                request.title(),
                request.description(),
                finalCategory,
                finalSeverity
        );

        // 4. Set Geospatial Location
        if (request.location() != null) {
            IncidentLocationEntity loc = new IncidentLocationEntity(
                    incident,
                    request.location().latitude(),
                    request.location().longitude(),
                    request.location().building(),
                    request.location().floor(),
                    request.location().zoneId(),
                    request.location().address()
            );
            incident.setLocation(loc);
        }

        // 5. Attachments
        if (request.attachmentUrls() != null) {
            for (String url : request.attachmentUrls()) {
                incident.addAttachment(url);
            }
        }

        // 6. Initial Status History Record
        incident.addStatusTransition(IncidentStatus.REPORTED, reporterId, "Initial emergency report created");

        // 7. Atomic INSERT into Incidents Table
        IncidentEntity saved = incidentRepository.save(incident);

        // 8. Transactional Outbox Event (Both commit atomically in same DB transaction)
        IncidentCreatedPayload payload = new IncidentCreatedPayload(
                saved.getId(),
                saved.getReporterId(),
                saved.getTitle(),
                saved.getDescription(),
                saved.getCategory(),
                saved.getSeverity(),
                saved.getStatus(),
                request.location(),
                request.attachmentUrls() != null ? request.attachmentUrls() : Collections.emptyList(),
                idempotencyKey
        );

        String effectiveTraceId = traceId != null ? traceId : UUID.randomUUID().toString();
        IncidentCreatedEventV1 event = new IncidentCreatedEventV1(saved.getId(), effectiveTraceId, payload);

        try {
            String eventJson = objectMapper.writeValueAsString(event);
            OutboxEventEntity outboxEvent = new OutboxEventEntity(
                    "Incident",
                    saved.getId(),
                    IncidentCreatedEventV1.EVENT_TYPE,
                    eventJson
            );
            outboxEventRepository.save(outboxEvent);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize outbox event payload", e);
        }

        IncidentResponse response = mapToResponse(saved);

        // 9. Store in Idempotency Cache (24h TTL)
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            try {
                String responseJson = objectMapper.writeValueAsString(response);
                redisTemplate.opsForValue().set(IDEMPOTENCY_KEY_PREFIX + idempotencyKey, responseJson, Duration.ofHours(24));
            } catch (JsonProcessingException e) {
                log.warn("Failed to cache response for idempotency key: {}", idempotencyKey);
            }
        }

        // Cache-aside warm up (10m TTL)
        cacheIncident(saved.getId(), response);

        return response;
    }

    // Cache-aside implementation (Section 9)
    public IncidentResponse getIncident(String id) {
        String cacheKey = CACHE_KEY_PREFIX + id;
        String cachedJson = redisTemplate.opsForValue().get(cacheKey);

        if (cachedJson != null) {
            try {
                return objectMapper.readValue(cachedJson, IncidentResponse.class);
            } catch (JsonProcessingException e) {
                log.warn("Error parsing cached incident JSON for id={}: {}", id, e.getMessage());
            }
        }

        IncidentEntity entity = incidentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Incident not found: " + id));

        IncidentResponse response = mapToResponse(entity);
        cacheIncident(id, response);
        return response;
    }

    public Page<IncidentResponse> getIncidents(IncidentStatus status, IncidentSeverity severity, IncidentCategory category, Pageable pageable) {
        return incidentRepository.findFiltered(status, severity, category, pageable)
                .map(this::mapToResponse);
    }

    @Transactional
    public IncidentResponse acknowledgeIncident(String incidentId, String responderId, String traceId) {
        IncidentEntity incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new IllegalArgumentException("Incident not found: " + incidentId));

        incident.setAcknowledgedAt(Instant.now());
        incident.addStatusTransition(IncidentStatus.ACKNOWLEDGED, responderId, "Incident acknowledged by assigned responder");
        IncidentEntity saved = incidentRepository.save(incident);

        long latencySeconds = Duration.between(saved.getCreatedAt(), saved.getAcknowledgedAt()).toSeconds();
        IncidentAcknowledgedPayload payload = new IncidentAcknowledgedPayload(
                saved.getId(),
                responderId,
                saved.getAcknowledgedAt(),
                latencySeconds
        );

        publishOutbox(saved.getId(), IncidentAcknowledgedEventV1.EVENT_TYPE,
                new IncidentAcknowledgedEventV1(saved.getId(), traceId, payload));

        evictCache(incidentId);
        return mapToResponse(saved);
    }

    @Transactional
    public IncidentResponse resolveIncident(String incidentId, String responderId, String resolutionNotes, String traceId) {
        IncidentEntity incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new IllegalArgumentException("Incident not found: " + incidentId));

        incident.setResolvedAt(Instant.now());
        incident.addStatusTransition(IncidentStatus.RESOLVED, responderId, resolutionNotes);
        IncidentEntity saved = incidentRepository.save(incident);

        long totalSeconds = Duration.between(saved.getCreatedAt(), saved.getResolvedAt()).toSeconds();
        IncidentResolvedPayload payload = new IncidentResolvedPayload(
                saved.getId(),
                responderId,
                resolutionNotes,
                saved.getResolvedAt(),
                totalSeconds
        );

        publishOutbox(saved.getId(), IncidentResolvedEventV1.EVENT_TYPE,
                new IncidentResolvedEventV1(saved.getId(), traceId, payload));

        evictCache(incidentId);
        return mapToResponse(saved);
    }

    @Transactional
    public void assignResponder(String incidentId, String responderId, Instant slaAckDeadline) {
        IncidentEntity incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new IllegalArgumentException("Incident not found: " + incidentId));

        incident.setAssignedResponderId(responderId);
        incident.setSlaAckDeadline(slaAckDeadline);
        incident.addStatusTransition(IncidentStatus.ASSIGNED, "SYSTEM", "Assigned to responder " + responderId);
        incidentRepository.save(incident);
        evictCache(incidentId);
    }

    private void publishOutbox(String aggregateId, String eventType, Object event) {
        try {
            String json = objectMapper.writeValueAsString(event);
            OutboxEventEntity outboxEvent = new OutboxEventEntity("Incident", aggregateId, eventType, json);
            outboxEventRepository.save(outboxEvent);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize outbox event", e);
        }
    }

    private void cacheIncident(String id, IncidentResponse response) {
        try {
            String json = objectMapper.writeValueAsString(response);
            redisTemplate.opsForValue().set(CACHE_KEY_PREFIX + id, json, Duration.ofMinutes(10));
        } catch (JsonProcessingException e) {
            log.warn("Failed to cache incident id={}", id, e);
        }
    }

    private void evictCache(String id) {
        redisTemplate.delete(CACHE_KEY_PREFIX + id);
    }

    private IncidentResponse mapToResponse(IncidentEntity e) {
        GeospatialLocationDto locDto = null;
        if (e.getLocation() != null) {
            locDto = new GeospatialLocationDto(
                    e.getLocation().getLatitude(),
                    e.getLocation().getLongitude(),
                    e.getLocation().getBuilding(),
                    e.getLocation().getFloor(),
                    e.getLocation().getZoneId(),
                    e.getLocation().getAddress()
            );
        }

        List<String> attachments = e.getAttachments() != null
                ? e.getAttachments().stream().map(a -> a.getAttachmentUrl()).toList()
                : List.of();

        return new IncidentResponse(
                e.getId(),
                e.getReporterId(),
                e.getTitle(),
                e.getDescription(),
                e.getCategory(),
                e.getSeverity(),
                e.getStatus(),
                e.getAssignedResponderId(),
                locDto,
                attachments,
                e.getSlaAckDeadline(),
                e.getSlaResolveDeadline(),
                e.getAcknowledgedAt(),
                e.getResolvedAt(),
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }
}
