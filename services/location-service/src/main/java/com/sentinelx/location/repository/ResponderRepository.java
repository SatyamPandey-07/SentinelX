package com.sentinelx.location.repository;

import com.sentinelx.location.entity.ResponderEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResponderRepository extends JpaRepository<ResponderEntity, String> {
    List<ResponderEntity> findByStatus(String status);
}
