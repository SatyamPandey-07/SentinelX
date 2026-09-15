package com.sentinelx.gateway.fallback;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/fallback")
public class FallbackController {

    @GetMapping("/incidents")
    @PostMapping("/incidents")
    public ResponseEntity<Map<String, Object>> incidentFallback() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                "timestamp", Instant.now().toString(),
                "status", HttpStatus.SERVICE_UNAVAILABLE.value(),
                "error", "Service Temporarily Degraded",
                "message", "Incident service is currently experiencing high load or undergoing circuit breaker recovery. Please retry in 5 seconds."
        ));
    }
}
