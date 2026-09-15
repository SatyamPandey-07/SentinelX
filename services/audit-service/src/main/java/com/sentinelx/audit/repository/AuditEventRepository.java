package com.sentinelx.audit.repository;

import com.sentinelx.audit.entity.AuditEventEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AuditEventRepository extends JpaRepository<AuditEventEntity, String> {
    Optional<AuditEventEntity> findTopByOrderByRecordedAtDesc();
    Page<AuditEventEntity> findAllByOrderByOccurredAtDesc(Pageable pageable);
}
