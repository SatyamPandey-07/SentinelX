# ADR-006: REST for Edge APIs vs gRPC for Low-Latency Internal Links

## Status
Accepted

## Context
Choosing communication protocols across 12 microservices requires balancing client ergonomics, developer debugging, and high-frequency binary throughput.

## Decision
Adopt a hybrid protocol strategy with strict demarcation:
1. **Public & Edge Gateway APIs (REST / JSON)**: Used between frontend/mobile clients, the API Gateway, and external notification webhooks. REST provides universal browser compatibility, easy OpenAPI/Swagger documentation, and straightforward debugging.
2. **Internal Low-Latency Service-to-Service (gRPC / HTTP/2 / Protobuf)**:
   - `Assignment Service -> Location Service`: High-frequency queries to compute distance matrices and filter nearest responder candidates.
   - Protobuf binary serialization significantly reduces payload overhead, and HTTP/2 multiplexing avoids TCP connection setup latency.

## Consequences
- **Positive**: Best-of-both-worlds: REST simplicity at the edge and high-performance binary transport for internal geospatial computation.
- **Tradeoff**: Maintenance of Protobuf schema contracts in `services/proto-contracts`.
