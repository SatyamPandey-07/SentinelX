# SentinelX: Networking & Protocol Architecture

## 1. Network Protocol Topology

```
Client Browser / Mobile
       |
       |  HTTPS (HTTP/1.1 or HTTP/2) / WSS (WebSockets)
       v
 NGINX Ingress Controller (TLS Termination)
       |
       |  HTTP/1.1 (Connection Keep-Alive, Pool size: 50)
       v
 Spring Cloud API Gateway (Port 8080)
   |       |                    |                    |
   | REST  | REST               | gRPC (HTTP/2)       | REST
   v       v                    v                    v
[Auth]  [Incident]     [Assignment Service]    [Search Service]
                              |
                              | gRPC Protobuf Multiplexing
                              v
                      [Location Service]
```

---

## 2. Connection Pooling & Keep-Alive
- **HikariCP**: PostgreSQL connection pool per service (Min: 2, Max: 10-15 connections) with `connection-timeout: 20000ms`.
- **HTTP Client**: Apache HttpClient 5 and Netty reactive pools configure keep-alive timeouts (60s) to reuse TCP connections between Gateway and backend services.
- **gRPC Multiplexing**: Assignment Service maintains a single persistent HTTP/2 connection channel to Location Service, multiplexing concurrent RPC requests over binary bidirectional streams.

---

## 3. Operational Linux & Networking Diagnostics
Useful commands for inspecting network and socket states in production:
```bash
# Inspect established TCP connections per service
ss -s
netstat -tulpn | grep LISTEN

# Trace DNS resolution inside Kubernetes cluster
nslookup location-service.sentinelx-prod.svc.cluster.local

# Check connection pool and socket states
lsof -i :8082
```
