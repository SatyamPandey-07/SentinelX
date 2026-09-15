# SentinelX - Continuous Integration & Continuous Delivery (CI/CD)

## 1. Overview

The SentinelX deployment pipeline implements automated, repeatable validation for both the Java 21 Spring Boot microservices, Python 3.10 AI services, and Next.js frontend. 

The pipeline is managed via **GitHub Actions** (`.github/workflows/ci.yml`) and enforces strict quality gates: static analysis, security vulnerability scanning, unit/integration testing, container builds, and Kubernetes manifest validation.

---

## 2. Pipeline Stages

```
 PR or Commit to Main
         │
 ┌───────┴───────────────────────┬───────────────────────────────┐
 ▼                               ▼                               ▼
Java Microservices Pipeline     Python AI Service Pipeline      Frontend Pipeline
- Checkstyle & SpotBugs         - Flake8 / Black formatting     - ESLint & Prettier
- Maven Compile                 - Pytest (Safety Guardrails)    - TypeScript Typecheck
- Unit & Testcontainers Tests   - Qdrant Mock Integration      - Next.js Production Build
- OWASP Dependency Check
 └───────┬───────────────────────┴───────────────────────────────┘
         │
         ▼
 Container Image Build & Vulnerability Scan
 - Multi-stage Docker Builds (Eclipse Temurin JRE 21, Python slim)
 - Trivy Container Vulnerability Scanner (Block on CRITICAL CVEs)
         │
         ▼
 Kubernetes Manifest Validation
 - Kubeval / Conftest (Policy as Code against OPA rules)
         │
         ▼
 Automated Staging Deployment (GitOps via ArgoCD)
```

---

## 3. Tooling Matrix

| Responsibility | Tool | Gate Requirement |
|---|---|---|
| **Java Code Quality** | Checkstyle & SpotBugs | 0 warnings or violations allowed |
| **Java Dependency Security** | OWASP Dependency-Check | CVSS score $\ge 7.0$ fails build |
| **Container Scanning** | Aqua Security Trivy | 0 CRITICAL vulnerabilities permitted |
| **Python Testing** | Pytest + Coverage | 100% pass on safety guardrails suite |
| **Frontend Linting** | Next.js ESLint + TypeScript | Strict mode, 0 type errors |
| **Deployment Engine** | ArgoCD (GitOps) | Syncs Kubernetes overlays upon PR merge |

---

## 4. Multi-Stage Docker Builds

Every service utilizes multi-stage Docker builds to ensure minimal attack surface and lightweight container sizes:
- **Build Stage**: Eclipse Temurin 21 JDK (or Python build tools) compile code and run tests.
- **Runtime Stage**: Eclipse Temurin 21 JRE minimal headless or Python 3.10 slim, executing as a dedicated unprivileged user (`appuser` with UID `10001`).
- Root filesystems are read-only with ephemeral `/tmp` mounted via `emptyDir`.
