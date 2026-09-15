# syntax=docker/dockerfile:1
# Build context MUST be the repository root (multi-module Maven reactor):
#   docker build -f services/audit-service/Dockerfile -t sentinelx/audit-service .
FROM maven:3.9.9-eclipse-temurin-21 AS builder
WORKDIR /build

# The parent pom declares all 12 reactor modules, so Maven must be able to
# read every module's pom.xml to resolve the graph even though -pl/-am below
# only compiles the subset this service actually depends on. Copying just
# the poms first (cheap, changes rarely) keeps the dependency layer cached
# across rebuilds that only touch source.
COPY pom.xml .
COPY services/common-dto/pom.xml services/common-dto/pom.xml
COPY services/proto-contracts/pom.xml services/proto-contracts/pom.xml
COPY services/api-gateway/pom.xml services/api-gateway/pom.xml
COPY services/auth-service/pom.xml services/auth-service/pom.xml
COPY services/incident-service/pom.xml services/incident-service/pom.xml
COPY services/assignment-service/pom.xml services/assignment-service/pom.xml
COPY services/location-service/pom.xml services/location-service/pom.xml
COPY services/sla-service/pom.xml services/sla-service/pom.xml
COPY services/search-service/pom.xml services/search-service/pom.xml
COPY services/realtime-service/pom.xml services/realtime-service/pom.xml
COPY services/notification-service/pom.xml services/notification-service/pom.xml
COPY services/analytics-service/pom.xml services/analytics-service/pom.xml
COPY services/audit-service/pom.xml services/audit-service/pom.xml
RUN mvn -q -pl services/audit-service -am -DskipTests dependency:go-offline || true

COPY services/common-dto services/common-dto
COPY services/proto-contracts services/proto-contracts
COPY services/audit-service services/audit-service
RUN mvn -q -pl services/audit-service -am -DskipTests package

FROM eclipse-temurin:21-jre-alpine AS runtime
RUN addgroup -S app && adduser -S -G app -u 1000 appuser
WORKDIR /app
COPY --from=builder /build/services/audit-service/target/audit-service-*.jar app.jar

# OpenTelemetry Java auto-instrumentation agent (Section 21): attaches at
# startup with zero code changes, auto-instrumenting Spring MVC/WebFlux,
# JDBC, Kafka producers/consumers, Redis clients and gRPC — exports real
# traces to the otel-collector -> Jaeger pipeline. Pinned to a real fetched
# release (v2.31.1), never `latest`. Metrics/logs exporters are off: this
# service already exports metrics via Micrometer/Prometheus (Actuator), and
# wiring the OTel logs bridge is a separate change tracked alongside
# structured JSON logging — exporting untested here would be a second,
# unused metrics/logs pipeline for the sake of appearing complete.
ADD https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/download/v2.31.1/opentelemetry-javaagent.jar /app/otel-javaagent.jar
RUN chmod 644 /app/otel-javaagent.jar && chown appuser:app /app/otel-javaagent.jar app.jar

USER appuser

EXPOSE 8090
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
    CMD wget -qO- http://localhost:8090/actuator/health | grep -q '"status":"UP"' || exit 1

ENV OTEL_SERVICE_NAME=audit-service \
    OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317 \
    OTEL_EXPORTER_OTLP_PROTOCOL=grpc \
    OTEL_TRACES_EXPORTER=otlp \
    OTEL_METRICS_EXPORTER=none \
    OTEL_LOGS_EXPORTER=none \
    OTEL_PROPAGATORS=tracecontext,baggage \
    OTEL_JAVAAGENT_ENABLED=true

ENTRYPOINT ["java", "-javaagent:/app/otel-javaagent.jar", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
