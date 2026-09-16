package com.sentinelx.gateway.filter;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Real unit tests for the gateway's edge auth enforcement (Section 4): the
 * one place every downstream service trusts to have already rejected an
 * unauthenticated request and to have set X-User-Id/X-User-Role correctly
 * from a real, verified JWT before anything reaches them.
 */
class GlobalAuthAndTraceFilterTest {

    private static final String SECRET = "test-secret-key-for-jwt-signing-at-least-256-bits-long-0123456789";
    private final SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));

    private GlobalAuthAndTraceFilter filter;
    private GatewayFilterChain chain;

    @BeforeEach
    void setUp() {
        filter = new GlobalAuthAndTraceFilter(SECRET);
        chain = mock(GatewayFilterChain.class);
        when(chain.filter(any())).thenReturn(Mono.empty());
    }

    private String validToken(String userId, String username, String role) {
        return Jwts.builder()
                .subject(userId)
                .claim("username", username)
                .claim("role", role)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 900_000))
                .signWith(key)
                .compact();
    }

    @Test
    void openEndpoint_bypassesAuthEntirelyEvenWithNoAuthorizationHeader() {
        MockServerHttpRequest request = MockServerHttpRequest.post("/api/v1/auth/login").build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        filter.filter(exchange, chain).block();

        verify(chain).filter(any());
        // The filter never touches the response for an open endpoint --
        // it just delegates straight to the chain, so no status should
        // have been written (in particular, never 401).
        assertNull(exchange.getResponse().getStatusCode());
    }

    @Test
    void protectedEndpoint_missingAuthorizationHeaderReturns401WithoutCallingChain() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/incidents").build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        filter.filter(exchange, chain).block();

        verify(chain, never()).filter(any());
        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
    }

    @Test
    void protectedEndpoint_malformedBearerPrefixReturns401() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/incidents")
                .header("Authorization", "Basic somebase64")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        filter.filter(exchange, chain).block();

        verify(chain, never()).filter(any());
        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
    }

    @Test
    void protectedEndpoint_validJwtForwardsVerifiedIdentityHeadersDownstream() {
        String token = validToken("user-42", "satyam", "ROLE_ADMIN");
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/incidents")
                .header("Authorization", "Bearer " + token)
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        filter.filter(exchange, chain).block();

        ArgumentCaptorHolder captured = new ArgumentCaptorHolder();
        verify(chain).filter(argThat(ex -> {
            captured.exchange = ex;
            return true;
        }));

        var forwardedHeaders = captured.exchange.getRequest().getHeaders();
        assertEquals("user-42", forwardedHeaders.getFirst("X-User-Id"));
        assertEquals("satyam", forwardedHeaders.getFirst("X-User-Name"));
        assertEquals("ROLE_ADMIN", forwardedHeaders.getFirst("X-User-Role"));
        assertNotNull(forwardedHeaders.getFirst("X-Trace-Id"));
    }

    @Test
    void protectedEndpoint_tokenSignedWithWrongKeyIsRejectedWith401() {
        SecretKey wrongKey = Keys.hmacShaKeyFor("a-completely-different-secret-key-0123456789-padding".getBytes(StandardCharsets.UTF_8));
        String tokenSignedWithWrongKey = Jwts.builder()
                .subject("attacker")
                .claim("role", "ROLE_ADMIN")
                .expiration(new Date(System.currentTimeMillis() + 900_000))
                .signWith(wrongKey)
                .compact();
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/incidents")
                .header("Authorization", "Bearer " + tokenSignedWithWrongKey)
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        filter.filter(exchange, chain).block();

        verify(chain, never()).filter(any());
        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
    }

    @Test
    void protectedEndpoint_expiredTokenIsRejectedWith401() {
        String expiredToken = Jwts.builder()
                .subject("user-1")
                .claim("role", "ROLE_USER")
                .issuedAt(new Date(System.currentTimeMillis() - 2_000_000))
                .expiration(new Date(System.currentTimeMillis() - 1_000_000))
                .signWith(key)
                .compact();
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/incidents")
                .header("Authorization", "Bearer " + expiredToken)
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        filter.filter(exchange, chain).block();

        verify(chain, never()).filter(any());
        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
    }

    private static final class ArgumentCaptorHolder {
        ServerWebExchange exchange;
    }
}
