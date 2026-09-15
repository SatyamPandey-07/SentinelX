package com.sentinelx.auth.repository;

import com.sentinelx.auth.entity.RefreshTokenEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshTokenEntity, String> {
    Optional<RefreshTokenEntity> findByTokenHash(String tokenHash);
    void deleteByUser_Id(String userId);
}
