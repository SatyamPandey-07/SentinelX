package com.sentinelx.incident.outbox;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OutboxEventRepository extends JpaRepository<OutboxEventEntity, String> {

    @Query("SELECT o FROM OutboxEventEntity o WHERE o.status = 'PENDING' AND o.retryCount < :maxRetries ORDER BY o.createdAt ASC")
    List<OutboxEventEntity> findPendingEvents(@Param("maxRetries") int maxRetries, Pageable pageable);

    long countByStatus(OutboxStatus status);
}
