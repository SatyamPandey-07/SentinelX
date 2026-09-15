package com.sentinelx.gateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

@Component
public class GlobalAuthAndTraceFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(GlobalAuthAndTraceFilter.class);

    private final SecretKey key;
    private final List<String> openEndpoints = List.of(
            "/api/v1/auth/",
            "/actuator/",
            "/ws/",
            "/fallback/"
    );

    public GlobalAuthAndTraceFilter(@Value("${jwt.secret}") String secret) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        // 1. Distributed Tracing: Propagate or generate X-Trace-Id (Section 21)
        String traceId = request.getHeaders().getFirst("X-Trace-Id");
        if (traceId == null || traceId.isBlank()) {
            traceId = UUID.randomUUID().toString();
        }

        // 2. Check if endpoint is publicly open
        boolean isOpen = openEndpoints.stream().anyMatch(path::startsWith);
        if (isOpen) {
            ServerHttpRequest mutatedRequest = request.mutate()
                    .header("X-Trace-Id", traceId)
                    .build();
            return chain.filter(exchange.mutate().request(mutatedRequest).build());
        }

        // 3. Extract and Validate Bearer Token
        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return onError(exchange, "Missing or invalid Authorization header", HttpStatus.UNAUTHORIZED);
        }

        String token = authHeader.substring(7);
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            String userId = claims.getSubject();
            String username = claims.get("username", String.class);
            String role = claims.get("role", String.class);

            // Forward verified user identity headers to downstream microservices
            ServerHttpRequest mutatedRequest = request.mutate()
                    .header("X-User-Id", userId != null ? userId : "")
                    .header("X-User-Name", username != null ? username : "")
                    .header("X-User-Role", role != null ? role : "")
                    .header("X-Trace-Id", traceId)
                    .build();

            return chain.filter(exchange.mutate().request(mutatedRequest).build());

        } catch (Exception e) {
            log.warn("Invalid JWT token rejected at gateway: {}", e.getMessage());
            return onError(exchange, "Unauthorized: " + e.getMessage(), HttpStatus.UNAUTHORIZED);
        }
    }

    private Mono<Void> onError(ServerWebExchange exchange, String err, HttpStatus httpStatus) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(httpStatus);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        String body = "{\"error\": \"" + httpStatus.getReasonPhrase() + "\", \"message\": \"" + err + "\"}";
        return response.writeWith(Mono.just(response.bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8))));
    }

    @Override
    public int getOrder() {
        return -100; // High priority in filter chain
    }
}
