package com.sentinelx.incident;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sentinelx.common.dto.GeospatialLocationDto;
import com.sentinelx.common.dto.IncidentCreateRequest;
import com.sentinelx.common.dto.IncidentResponse;
import com.sentinelx.common.enums.IncidentCategory;
import com.sentinelx.common.enums.IncidentSeverity;
import com.sentinelx.common.enums.IncidentStatus;
import com.sentinelx.incident.client.AiClassificationClient;
import com.sentinelx.incident.client.DuplicateCheckClient;
import com.sentinelx.incident.entity.IncidentEntity;
import com.sentinelx.incident.outbox.OutboxEventEntity;
import com.sentinelx.incident.outbox.OutboxEventRepository;
import com.sentinelx.incident.repository.IncidentRepository;
import com.sentinelx.incident.service.IncidentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IncidentServiceTest {

    @Mock
    private IncidentRepository incidentRepository;

    @Mock
    private OutboxEventRepository outboxEventRepository;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @Mock
    private AiClassificationClient aiClassificationClient;

    @Mock
    private DuplicateCheckClient duplicateCheckClient;

    private ObjectMapper objectMapper;
    private IncidentService incidentService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        // Unstubbed: both clients default to Optional.empty() (Mockito's
        // built-in Optional-aware default answer), exercising the same
        // "AI/search unavailable" fallback path production traffic hits
        // when either downstream call fails — see AiClassificationClient /
        // DuplicateCheckClient javadoc for why that's the safe default.
        incidentService = new IncidentService(incidentRepository, outboxEventRepository, redisTemplate, objectMapper,
                aiClassificationClient, duplicateCheckClient);
    }

    @Test
    void testCreateIncidentCreatesEntityAndOutboxAtomically() {
        GeospatialLocationDto loc = new GeospatialLocationDto(37.7749, -122.4194, "Science Bldg", "3", "ZONE-A", "100 Campus Way");
        IncidentCreateRequest req = new IncidentCreateRequest(
                "Chemical Spill in Lab",
                "Spill of solvent in chem room 302",
                IncidentCategory.FIRE,
                IncidentSeverity.HIGH,
                loc,
                List.of("http://s3.local/img1.jpg")
        );

        when(incidentRepository.save(any(IncidentEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        IncidentResponse res = incidentService.createIncident(req, "user-123", "idemp-key-1", "trace-1");

        assertNotNull(res);
        assertNotNull(res.id());
        assertEquals("Chemical Spill in Lab", res.title());
        assertEquals(IncidentStatus.REPORTED, res.status());

        // Verify that an outbox event was created in the exact same call
        ArgumentCaptor<OutboxEventEntity> outboxCaptor = ArgumentCaptor.forClass(OutboxEventEntity.class);
        verify(outboxEventRepository).save(outboxCaptor.capture());

        OutboxEventEntity outboxEvent = outboxCaptor.getValue();
        assertEquals("Incident", outboxEvent.getAggregateType());
        assertEquals(res.id(), outboxEvent.getAggregateId());
        assertEquals("incident.created", outboxEvent.getEventType());
        assertTrue(outboxEvent.getPayload().contains("Chemical Spill in Lab"));
    }

    @Test
    void testIdempotentRequestReturnsCachedResultWithoutInsert() throws Exception {
        GeospatialLocationDto loc = new GeospatialLocationDto(37.7749, -122.4194, "Bldg 1", "1", "Z1", "Address");
        IncidentResponse cachedRes = new IncidentResponse(
                "existing-id-1", "user-1", "Title", "Desc", IncidentCategory.FIRE,
                IncidentSeverity.CRITICAL, IncidentStatus.REPORTED, null, loc, List.of(),
                null, null, null, null, null, null
        );

        when(valueOperations.get("idempotency:incident:duplicate-key"))
                .thenReturn(objectMapper.writeValueAsString(cachedRes));

        IncidentCreateRequest req = new IncidentCreateRequest(
                "Title", "Desc", IncidentCategory.FIRE, IncidentSeverity.CRITICAL, loc, List.of()
        );

        IncidentResponse result = incidentService.createIncident(req, "user-1", "duplicate-key", "trace-1");

        assertEquals("existing-id-1", result.id());
        verify(incidentRepository, never()).save(any());
        verify(outboxEventRepository, never()).save(any());
    }
}
