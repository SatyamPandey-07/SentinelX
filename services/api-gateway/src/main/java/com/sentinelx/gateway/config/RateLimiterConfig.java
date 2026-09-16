package com.sentinelx.gateway.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

/**
 * Rate-limit key resolvers backing the RequestRateLimiter filter on each
 * route in application.yml (Section 43). Spring Cloud Gateway's built-in
 * RedisRateLimiter (token bucket, Lua script, auto-configured because
 * spring-boot-starter-data-redis-reactive is on the classpath) enforces
 * the actual limit -- this class only decides *what bucket* a request
 * counts against.
 */
@Configuration
public class RateLimiterConfig {

    private final SecretKey key;

    public RateLimiterConfig(@Value("${jwt.secret}") String secret) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Authenticated requests are keyed by the JWT subject (user ID), so a
     * user's limit follows them across devices/IPs and can't be trivially
     * reset by rotating networks. Anonymous or unparseable requests fall
     * back to the caller's IP so a single abusive anonymous client can't
     * exhaust a bucket shared with every other unauthenticated caller.
     */
    @Bean
    public KeyResolver userOrIpKeyResolver() {
        return exchange -> {
            String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                try {
                    Claims claims = Jwts.parser().verifyWith(key).build()
                            .parseSignedClaims(authHeader.substring(7)).getPayload();
                    return Mono.just("user:" + claims.getSubject());
                } catch (JwtException | IllegalArgumentException ignored) {
                    // Invalid/expired token -- fall through to IP-keyed below.
                    // The downstream GlobalAuthAndTraceFilter is what actually
                    // rejects the request; this resolver only needs a stable
                    // bucket key, not to duplicate auth enforcement.
                }
            }
            return Mono.just("ip:" + resolveIp(exchange));
        };
    }

    /**
     * Strict IP-only resolver for pre-authentication endpoints (login,
     * register) -- there is no JWT yet to key on, and this is exactly the
     * surface credential-stuffing/brute-force attempts target.
     */
    @Bean
    public KeyResolver ipKeyResolver() {
        return exchange -> Mono.just("ip:" + resolveIp(exchange));
    }

    private static String resolveIp(org.springframework.web.server.ServerWebExchange exchange) {
        // Prefer X-Forwarded-For (set by a real upstream proxy/load balancer
        // in front of the gateway) over the raw socket address, which would
        // otherwise just be the proxy's own IP for every request.
        String forwarded = exchange.getRequest().getHeaders().getFirst("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return exchange.getRequest().getRemoteAddress() != null
                ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
                : "unknown";
    }
}
