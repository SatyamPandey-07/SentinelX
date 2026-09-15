package com.sentinelx.incident.controller;

import com.sentinelx.common.dto.IncidentCreateRequest;
import com.sentinelx.common.dto.IncidentResponse;
import com.sentinelx.common.enums.IncidentCategory;
import com.sentinelx.common.enums.IncidentSeverity;
import com.sentinelx.common.enums.IncidentStatus;
import com.sentinelx.incident.service.IncidentService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/incidents")
public class IncidentController {

    private final IncidentService incidentService;

    public IncidentController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }

    @PostMapping
    public ResponseEntity<IncidentResponse> createIncident(
            @Valid @RequestBody IncidentCreateRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String userId,
            @RequestHeader(value = "X-Trace-Id", required = false) String traceId) {

        IncidentResponse response = incidentService.createIncident(request, userId, idempotencyKey, traceId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<IncidentResponse> getIncident(@PathVariable String id) {
        return ResponseEntity.ok(incidentService.getIncident(id));
    }

    @GetMapping
    public ResponseEntity<Page<IncidentResponse>> getIncidents(
            @RequestParam(required = false) IncidentStatus status,
            @RequestParam(required = false) IncidentSeverity severity,
            @RequestParam(required = false) IncidentCategory category,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {

        return ResponseEntity.ok(incidentService.getIncidents(status, severity, category, pageable));
    }

    @PostMapping("/{id}/acknowledge")
    public ResponseEntity<IncidentResponse> acknowledgeIncident(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Id", defaultValue = "system") String responderId,
            @RequestHeader(value = "X-Trace-Id", required = false) String traceId) {

        return ResponseEntity.ok(incidentService.acknowledgeIncident(id, responderId, traceId));
    }

    @PostMapping("/{id}/resolve")
    public ResponseEntity<IncidentResponse> resolveIncident(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> body,
            @RequestHeader(value = "X-User-Id", defaultValue = "system") String responderId,
            @RequestHeader(value = "X-Trace-Id", required = false) String traceId) {

        String notes = body != null ? body.getOrDefault("notes", "Resolved successfully") : "Resolved successfully";
        return ResponseEntity.ok(incidentService.resolveIncident(id, responderId, notes, traceId));
    }
}
