package com.sentinelx.analytics.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI/Swagger documentation (Section 38) -- served at /swagger-ui.html
 * and /v3/api-docs once this service is running. Real generated docs from
 * the actual controller annotations, not a hand-written spec that drifts.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        final String bearerScheme = "bearerAuth";
        return new OpenAPI()
                .info(new Info()
                        .title("SentinelX -- analytics-service")
                        .description("Response/resolution metrics, SLA compliance, and incident trend aggregation")
                        .version("v1"))
                .addSecurityItem(new SecurityRequirement().addList(bearerScheme))
                .components(new io.swagger.v3.oas.models.Components()
                        .addSecuritySchemes(bearerScheme, new SecurityScheme()
                                .name(bearerScheme)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }
}
