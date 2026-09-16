package com.sentinelx.gateway.config;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Real unit tests for the rate-limit bucket key resolution (Section 43):
 * which bucket a request counts against determines whether the limit
 * actually protects anything or is trivially bypassed.
 */
class RateLimiterConfigTest {

    private static final String SECRET = "test-secret-key-for-jwt-signing-at-least-256-bits-long-0123456789";
    private final SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
    private final RateLimiterConfig config = new RateLimiterConfig(SECRET);

    private String validToken(String userId) {
        return Jwts.builder()
                .subject(userId)
                .expiration(new Date(System.currentTimeMillis() + 900_000))
                .signWith(key)
                .compact();
    }

    @Test
    void userOrIpKeyResolver_authenticatedRequestKeysByJwtSubject() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/incidents")
                .header("Authorization", "Bearer " + validToken("user-99"))
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        String resolvedKey = config.userOrIpKeyResolver().resolve(exchange).block();

        assertEquals("user:user-99", resolvedKey);
    }

    @Test
    void userOrIpKeyResolver_sameUserGetsSameKeyRegardlessOfSourceIp() {
        MockServerHttpRequest fromOffice = MockServerHttpRequest.get("/api/v1/incidents")
                .header("Authorization", "Bearer " + validToken("user-7"))
                .header("X-Forwarded-For", "10.0.0.1")
                .build();
        MockServerHttpRequest fromHome = MockServerHttpRequest.get("/api/v1/incidents")
                .header("Authorization", "Bearer " + validToken("user-7"))
                .header("X-Forwarded-For", "203.0.113.55")
                .build();

        String key1 = config.userOrIpKeyResolver().resolve(MockServerWebExchange.from(fromOffice)).block();
        String key2 = config.userOrIpKeyResolver().resolve(MockServerWebExchange.from(fromHome)).block();

        assertEquals(key1, key2);
        assertEquals("user:user-7", key1);
    }

    @Test
    void userOrIpKeyResolver_noTokenFallsBackToForwardedForIp() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/incidents")
                .header("X-Forwarded-For", "198.51.100.23, 10.0.0.1")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        String resolvedKey = config.userOrIpKeyResolver().resolve(exchange).block();

        // First entry in X-Forwarded-For is the original client, not any
        // intermediate proxy hop.
        assertEquals("ip:198.51.100.23", resolvedKey);
    }

    @Test
    void userOrIpKeyResolver_garbageTokenFallsBackToIpInsteadOfThrowing() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/incidents")
                .header("Authorization", "Bearer not-a-real-jwt")
                .header("X-Forwarded-For", "192.0.2.1")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        String resolvedKey = config.userOrIpKeyResolver().resolve(exchange).block();

        assertEquals("ip:192.0.2.1", resolvedKey);
    }

    @Test
    void ipKeyResolver_ignoresAnyBearerTokenAndAlwaysKeysByIp() {
        MockServerHttpRequest request = MockServerHttpRequest.post("/api/v1/auth/login")
                .header("Authorization", "Bearer " + validToken("user-1"))
                .header("X-Forwarded-For", "203.0.113.9")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        String resolvedKey = config.ipKeyResolver().resolve(exchange).block();

        assertEquals("ip:203.0.113.9", resolvedKey);
        assertTrue(!resolvedKey.contains("user-1"));
    }
}
