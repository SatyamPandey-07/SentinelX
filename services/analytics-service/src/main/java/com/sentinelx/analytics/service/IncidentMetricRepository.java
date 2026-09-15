package com.sentinelx.analytics.service;

import com.sentinelx.analytics.entity.IncidentMetricEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentMetricRepository extends JpaRepository<IncidentMetricEntity, String> {

    @Query("SELECT m.responseTimeSeconds FROM IncidentMetricEntity m WHERE m.responseTimeSeconds IS NOT NULL ORDER BY m.responseTimeSeconds ASC")
    List<Long> findAllResponseTimes();

    @Query("SELECT m.resolutionTimeSeconds FROM IncidentMetricEntity m WHERE m.resolutionTimeSeconds IS NOT NULL ORDER BY m.resolutionTimeSeconds ASC")
    List<Long> findAllResolutionTimes();

    long countBySlaBreached(boolean slaBreached);
}
