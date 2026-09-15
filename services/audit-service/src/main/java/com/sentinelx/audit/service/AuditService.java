package com.sentinelx.audit.service;

import com.sentinelx.audit.entity.AuditEventEntity;
import com.sentinelx.audit.repository.AuditEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;

@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);
    private static final String GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

    private final AuditEventRepository auditEventRepository;

    public AuditService(AuditEventRepository auditEventRepository) {
        this.auditEventRepository = auditEventRepository;
    }

    @Transactional
    public synchronized AuditEventEntity recordEvent(
            String principalId,
            String principalRole,
            String action,
            String resourceType,
            String resourceId,
            String payload,
            Instant occurredAt) {

        String prevHash = auditEventRepository.findTopByOrderByRecordedAtDesc()
                .map(AuditEventEntity::getCurrHash)
                .orElse(GENESIS_HASH);

        String currHash = computeHash(prevHash, principalId, action, resourceId, occurredAt, payload);

        AuditEventEntity entity = new AuditEventEntity(
                principalId,
                principalRole,
                action,
                resourceType,
                resourceId,
                payload,
                prevHash,
                currHash,
                occurredAt
        );

        AuditEventEntity saved = auditEventRepository.save(entity);
        log.info("Recorded immutable audit record id={} action={} hash={}", saved.getId(), action, currHash.substring(0, 8));
        return saved;
    }

    public Page<AuditEventEntity> getAuditTrail(Pageable pageable) {
        return auditEventRepository.findAllByOrderByOccurredAtDesc(pageable);
    }

    private String computeHash(String prevHash, String principalId, String action, String resourceId, Instant occurredAt, String payload) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            String data = prevHash + ":" + principalId + ":" + action + ":" + resourceId + ":" + occurredAt + ":" + payload;
            byte[] hashBytes = digest.digest(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm missing", e);
        }
    }
}
