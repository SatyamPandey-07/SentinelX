package com.sentinelx.incident.repository;

import com.sentinelx.common.enums.IncidentCategory;
import com.sentinelx.common.enums.IncidentSeverity;
import com.sentinelx.common.enums.IncidentStatus;
import com.sentinelx.incident.entity.IncidentEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface IncidentRepository extends JpaRepository<IncidentEntity, String> {

    Page<IncidentEntity> findByStatus(IncidentStatus status, Pageable pageable);

    Page<IncidentEntity> findBySeverity(IncidentSeverity severity, Pageable pageable);

    Page<IncidentEntity> findByCategory(IncidentCategory category, Pageable pageable);

    @Query("SELECT i FROM IncidentEntity i WHERE " +
           "(:status IS NULL OR i.status = :status) AND " +
           "(:severity IS NULL OR i.severity = :severity) AND " +
           "(:category IS NULL OR i.category = :category)")
    Page<IncidentEntity> findFiltered(
            @Param("status") IncidentStatus status,
            @Param("severity") IncidentSeverity severity,
            @Param("category") IncidentCategory category,
            Pageable pageable);

    List<IncidentEntity> findByCreatedAtAfter(Instant timestamp);
}
