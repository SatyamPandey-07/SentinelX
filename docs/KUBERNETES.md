# SentinelX - Kubernetes Architecture & Production Deployment Guide

## 1. Cluster Architecture Overview

SentinelX deploys to Kubernetes using a cloud-native microservices topology with clear separation between stateless compute services, stateful persistence backends, and ingress controllers.

```
                    ┌─────────────────────────┐
                    │ External TLS Traffic    │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │ Ingress-Nginx Controller│
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │ API Gateway Service     │
                    │ (ClusterIP :8080)       │
                    └────────────┬────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
 ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
 │ Incident Pods │       │ Auth Pods     │       │ AI Pods       │
 │ HPA: 2-10     │       │ HPA: 2-6      │       │ HPA: 2-8      │
 └───────┬───────┘       └───────┬───────┘       └───────┬───────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                                 ▼
                   ┌───────────────────────────┐
                   │ Managed Stateful Services │
                   │ - PostgreSQL (RDS / CNPG) │
                   │ - Redis Sentinel / Cluster│
                   │ - Managed Kafka (MSK/Strimzi)│
                   │ - OpenSearch Cluster      │
                   └───────────────────────────┘
```

---

## 2. Namespace Strategy

SentinelX isolates deployment tiers across dedicated namespaces:
- `sentinelx-dev`: Active developer testing and feature validation.
- `sentinelx-stage`: Pre-production soak testing and chaos engineering.
- `sentinelx-prod`: Hardened production workloads with strict network policies.

---

## 3. Pod Health Probes & Zero-Downtime Rollouts

Every Spring Boot microservice exposes Kubernetes probes backed by Spring Boot Actuator:
- **Liveness Probe**: `/actuator/health/liveness` (checks if the JVM process is stuck or in an unrecoverable state).
- **Readiness Probe**: `/actuator/health/readiness` (verifies DB connection pool, Kafka consumer group assignment, and Redis reachability before admitting external ingress traffic).

```yaml
livenessProbe:
  httpGet:
    path: /actuator/health/liveness
    port: 8081
  initialDelaySeconds: 30
  periodSeconds: 10
readinessProbe:
  httpGet:
    path: /actuator/health/readiness
    port: 8081
  initialDelaySeconds: 20
  periodSeconds: 5
```

Rollout Strategy:
```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 25%
    maxUnavailable: 0
```

---

## 4. Horizontal Pod Autoscaling (HPA)

Workloads auto-scale based on both CPU utilization and Kafka consumer lag (via KEDA or Custom Prometheus Metrics Adapter):

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: incident-service-hpa
  namespace: sentinelx-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: incident-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

---

## 5. Security & Secret Management

- **No Secrets in Git**: Plaintext secrets are strictly prohibited. Production environments use External Secrets Operator (integrating AWS Secrets Manager or HashiCorp Vault) or Sealed Secrets.
- **Non-Root Container Execution**: All container Dockerfiles enforce non-root users (`UID 10001`) with read-only root filesystems and disabled privilege escalation.
- **Network Policies**: Calico / Cilium network policies restrict pod-to-pod communication. For example, `ai-service` cannot directly query the PostgreSQL database; only internal gRPC from authorized orchestrators is admitted.
