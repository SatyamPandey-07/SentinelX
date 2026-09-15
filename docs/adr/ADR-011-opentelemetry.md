# ADR-011: OpenTelemetry Distributed Tracing & W3C TraceContext

## Status
Accepted

## Context
In a distributed event-driven system with 12 microservices, diagnosing why an incident assignment lagged or why a notification failed across async boundaries is impossible using isolated local log files.

## Decision
Implement end-to-end distributed tracing using OpenTelemetry (OTel):
1. **W3C TraceContext**: API Gateway injects standard `traceparent` and `X-Trace-Id` headers.
2. **Kafka Header Propagation**: Producers propagate trace IDs inside Kafka record headers; consumers extract the context to continue the distributed trace span.
3. **Collector & Jaeger**: Spans are exported via OTLP gRPC to the OpenTelemetry Collector and visualized in Jaeger.
4. **Structured Logging**: Mapped Diagnostic Context (MDC) includes `trace_id` and `span_id` in every JSON log message.

## Consequences
- **Positive**: Complete observability into async event chains across Gateway -> Incident -> Kafka -> Assignment -> Notification.
- **Tradeoff**: Marginal latency overhead (< 1ms per span) for network telemetry export.
