# SentinelX: Security & Threat Mitigation Architecture

## 1. Authentication & Token Architecture
- **Password Hashing**: BCrypt with strength factor 12 (work factor tuned to prevent offline dictionary/rainbow table attacks).
- **JWT Access Tokens**: Short-lived (15 minutes), signed using HMAC-SHA256 with 256-bit secret keys.
- **Refresh Tokens**: Stored hashed (SHA-256) in PostgreSQL with strict **Refresh Token Rotation**. When refreshed, the existing token is revoked immediately and a new pair is issued.
- **Account Lockout Policy**: Monitored via Redis counters (`auth:failed_attempts:{user}`). Reaching 5 failed attempts locks the account for 15 minutes.

---

## 2. Role-Based Access Control (RBAC)

| Role | Permissions | Scope |
|------|-------------|-------|
| `ROLE_USER` | Report incidents, query self profile | Campus community students, faculty |
| `ROLE_RESPONDER` | View assigned incidents, acknowledge, resolve | First responders, EMTs, police |
| `ROLE_SUPERVISOR` | View all incidents, reassign responders, manage zones | Shift commanders, dispatch supervisors |
| `ROLE_ADMIN` | Full access, user management, audit review | Campus safety directors, IT admins |
| `ROLE_SYSTEM` | Publish/consume internal events, gRPC telemetry | Microservices, automated agents |

---

## 3. Defense in Depth
- **Zero Secrets in Git**: Externalized via environment variables and Kubernetes secrets.
- **Container Hardening**: All Docker images execute with non-root user `appuser` (UID 1000).
- **Gateway Rate Limiting**: Redis Token Bucket rate limiting defends against brute-force and DDoS attacks.
