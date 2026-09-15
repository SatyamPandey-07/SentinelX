package com.sentinelx.location.repository;

import com.sentinelx.location.entity.CampusZoneEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CampusZoneRepository extends JpaRepository<CampusZoneEntity, String> {
}
