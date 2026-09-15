# syntax=docker/dockerfile:1
# Build context MUST be the repository root (multi-module Maven reactor):
#   docker build -f services/api-gateway/Dockerfile -t sentinelx/api-gateway .
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
RUN mvn -q -pl services/api-gateway -am -DskipTests dependency:go-offline || true

COPY services/common-dto services/common-dto
COPY services/proto-contracts services/proto-contracts
COPY services/api-gateway services/api-gateway
RUN mvn -q -pl services/api-gateway -am -DskipTests package

FROM eclipse-temurin:21-jre-alpine AS runtime
RUN addgroup -S app && adduser -S -G app -u 1000 appuser
WORKDIR /app
COPY --from=builder /build/services/api-gateway/target/api-gateway-*.jar app.jar
USER appuser

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
    CMD wget -qO- http://localhost:8080/actuator/health | grep -q '"status":"UP"' || exit 1

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
