# ADR-010: Container Orchestration via Kubernetes & Declarative Scaling

## Status
Accepted

## Context
Deploying 12 microservices and polyglot dependencies (Java, Python, Next.js) in production requires automated self-healing, rolling zero-downtime updates, dynamic horizontal scaling, and secure secret injection.

## Decision
Adopt Kubernetes with Kustomize overlays for declarative deployments:
1. **Namespaces**: Isolated `sentinelx-dev` and `sentinelx-prod` environments.
2. **Resilience**: Readiness probes (`/actuator/health`) prevent premature traffic routing; liveness probes automatically restart deadlocked containers.
3. **Horizontal Pod Autoscaling (HPA)**: Automatically scales critical services (e.g. `api-gateway`, `incident-service`) between 3 and 10 replicas when CPU exceeds 75%.
4. **Security**: Containers enforce `runAsNonRoot: true` with non-privileged user IDs (1000). Secrets are externalized via Kubernetes Secrets.

## Consequences
- **Positive**: Cloud-agnostic deployment (AWS EKS, GKE, or local Minikube/Kind).
- **Tradeoff**: Operational overhead managed by reproducible Kustomize manifests.
