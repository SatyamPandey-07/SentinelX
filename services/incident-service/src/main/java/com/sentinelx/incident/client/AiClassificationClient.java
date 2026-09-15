package com.sentinelx.incident.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.sentinelx.common.enums.IncidentCategory;
import com.sentinelx.common.enums.IncidentSeverity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Optional;

/**
 * Synchronous call to ai-service's /classify endpoint (Section 1, items
 * 4-5: "Runs AI classification" / "Determines severity").
 *
 * Section 23 failure handling: AI unavailability must never make an
 * incident disappear. A short, fixed timeout plus a broad catch means any
 * failure (connection refused, timeout, malformed response, an unmapped
 * enum value) degrades to "no AI opinion" rather than failing incident
 * creation — the caller falls back to the reporter-supplied category and
 * severity. Note that ai-service's OWN deterministic safety guardrail
 * (rule_guardrail.py) still runs inside that call before any LLM/keyword
 * logic, so a successful response for a life-threatening pattern is never
 * a "soft" AI opinion — see AI.md / ADR-012.
 */
@Component
public class AiClassificationClient {

    private static final Logger log = LoggerFactory.getLogger(AiClassificationClient.class);

    private final RestClient restClient;

    public AiClassificationClient(
            @Value("${ai-service.url}") String baseUrl,
            @Value("${ai-service.timeout-ms:2000}") int timeoutMs) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(timeoutMs);
        factory.setReadTimeout(timeoutMs);
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .build();
    }

    public Optional<ClassificationResult> classify(String title, String description, IncidentCategory categoryHint) {
        try {
            ClassificationRequest request = new ClassificationRequest(
                    title, description, categoryHint != null ? categoryHint.name() : null);

            ClassificationResponse response = restClient.post()
                    .uri("/api/v1/ai/classify")
                    .body(request)
                    .retrieve()
                    .body(ClassificationResponse.class);

            if (response == null) {
                return Optional.empty();
            }

            return Optional.of(new ClassificationResult(
                    IncidentCategory.valueOf(response.category()),
                    IncidentSeverity.valueOf(response.severity()),
                    response.confidence(),
                    response.reasoning(),
                    response.safetyRuleApplied()));
        } catch (Exception e) {
            log.warn("AI classification unavailable ({}: {}); falling back to reporter-supplied category/severity.",
                    e.getClass().getSimpleName(), e.getMessage());
            return Optional.empty();
        }
    }

    record ClassificationRequest(
            @JsonProperty("title") String title,
            @JsonProperty("description") String description,
            @JsonProperty("category_hint") String categoryHint) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record ClassificationResponse(
            @JsonProperty("category") String category,
            @JsonProperty("severity") String severity,
            @JsonProperty("confidence") double confidence,
            @JsonProperty("reasoning") String reasoning,
            @JsonProperty("recommended_actions") List<String> recommendedActions,
            @JsonProperty("safety_rule_applied") boolean safetyRuleApplied) {}

    public record ClassificationResult(
            IncidentCategory category,
            IncidentSeverity severity,
            double confidence,
            String reasoning,
            boolean safetyRuleApplied) {}
}
