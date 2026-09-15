package com.sentinelx.audit.controller;

import com.sentinelx.audit.entity.AuditEventEntity;
import com.sentinelx.audit.service.AuditService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/audit")
public class AuditController {

    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping("/events")
    public ResponseEntity<Page<AuditEventEntity>> getAuditTrail(
            @PageableDefault(size = 50, sort = "occurredAt") Pageable pageable) {
        return ResponseEntity.ok(auditService.getAuditTrail(pageable));
    }
}
