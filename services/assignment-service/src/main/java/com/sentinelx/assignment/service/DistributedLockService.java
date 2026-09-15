package com.sentinelx.assignment.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Redis Distributed Locking Mechanism.
 * Solves the Concurrency Race Condition (Section 30):
 * If two high-priority incidents arrive simultaneously, both assignment service workers
 * might score the exact same nearest responder as the winner.
 * Without distributed coordination, both incidents would claim Responder X (double assignment).
 *
 * This service uses an atomic Redis SETNX with TTL to lock the responder during assignment.
 * If lock acquisition fails, the assignment algorithm automatically falls back to Candidate #2.
 */
@Service
public class DistributedLockService {

    private static final Logger log = LoggerFactory.getLogger(DistributedLockService.class);
    private static final String LOCK_PREFIX = "lock:responder:";

    private final StringRedisTemplate redisTemplate;
    private final Duration lockTtl;

    public DistributedLockService(
            StringRedisTemplate redisTemplate,
            @Value("${assignment.lock-ttl-seconds:10}") int lockTtlSeconds) {
        this.redisTemplate = redisTemplate;
        this.lockTtl = Duration.ofSeconds(lockTtlSeconds);
    }

    public boolean tryAcquire(String responderId, String incidentId) {
        String key = LOCK_PREFIX + responderId;
        Boolean success = redisTemplate.opsForValue().setIfAbsent(key, incidentId, lockTtl);
        if (Boolean.TRUE.equals(success)) {
            log.info("Acquired distributed lock for responder={} by incident={}", responderId, incidentId);
            return true;
        } else {
            String currentOwner = redisTemplate.opsForValue().get(key);
            log.warn("Failed to acquire lock for responder={}, currently claimed by incident={}", responderId, currentOwner);
            return false;
        }
    }

    public void release(String responderId, String incidentId) {
        String key = LOCK_PREFIX + responderId;
        String currentOwner = redisTemplate.opsForValue().get(key);
        if (incidentId.equals(currentOwner)) {
            redisTemplate.delete(key);
            log.info("Released distributed lock for responder={} by incident={}", responderId, incidentId);
        }
    }
}
