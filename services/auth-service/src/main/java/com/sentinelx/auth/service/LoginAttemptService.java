package com.sentinelx.auth.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class LoginAttemptService {

    private static final Logger log = LoggerFactory.getLogger(LoginAttemptService.class);
    private static final String FAILED_ATTEMPT_PREFIX = "auth:failed_attempts:";
    private static final String LOCKOUT_PREFIX = "auth:lockout:";

    private final StringRedisTemplate redisTemplate;
    private final int maxAttempts;
    private final long lockoutDurationMinutes;

    public LoginAttemptService(
            StringRedisTemplate redisTemplate,
            @Value("${security.lockout.max-attempts:5}") int maxAttempts,
            @Value("${security.lockout.lockout-duration-minutes:15}") long lockoutDurationMinutes) {
        this.redisTemplate = redisTemplate;
        this.maxAttempts = maxAttempts;
        this.lockoutDurationMinutes = lockoutDurationMinutes;
    }

    public void loginSucceeded(String key) {
        redisTemplate.delete(FAILED_ATTEMPT_PREFIX + key);
        redisTemplate.delete(LOCKOUT_PREFIX + key);
    }

    public void loginFailed(String key) {
        String attemptKey = FAILED_ATTEMPT_PREFIX + key;
        Long attempts = redisTemplate.opsForValue().increment(attemptKey);
        if (attempts != null && attempts == 1) {
            redisTemplate.expire(attemptKey, Duration.ofMinutes(lockoutDurationMinutes));
        }

        if (attempts != null && attempts >= maxAttempts) {
            log.warn("Account lockout triggered for identifier: {} after {} failed attempts", key, attempts);
            redisTemplate.opsForValue().set(LOCKOUT_PREFIX + key, "LOCKED", Duration.ofMinutes(lockoutDurationMinutes));
        }
    }

    public boolean isLocked(String key) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(LOCKOUT_PREFIX + key));
    }
}
