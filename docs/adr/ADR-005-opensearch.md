# ADR-005: OpenSearch for Search & Spatial-Temporal Duplicate Detection

## Status
Accepted

## Context
During campus crises (e.g. fire alarm in chemistry hall), dozens of bystanders submit reports with slight variations in wording ("fire in lab", "smoke on 3rd floor", "chemical explosion").
PostgreSQL queries with `LIKE '%smoke%'` or complex trigram joins across text and geospatial coordinates cannot deliver sub-200ms latencies under heavy query volume.

## Decision
Deploy OpenSearch as an eventually consistent secondary read index populated via Kafka events.
Key capabilities:
1. **Full-Text Tokenization & Stemming**: Fast multi-field search across title and description.
2. **Duplicate Detection Engine**: Combines category equality, spatial radius (<= 150m), time window (<= 10 min), and text token similarity score (>= 0.70) to identify duplicate reports automatically.
3. **Decoupled Failure Boundary**: If OpenSearch goes down, incident submission continues uninterrupted in PostgreSQL.

## Consequences
- **Positive**: Sub-100ms search latency and automated duplicate incident suppression.
- **Tradeoff**: Eventual consistency gap (typically 50-200ms from database commit to OpenSearch indexing).
