# SentinelX - Retrieval-Augmented Generation (RAG) Architecture

## 1. Objective & Operational Context

During an active crisis, responders cannot afford to flip through 300-page binders of Environmental Health & Safety (EHS) manuals, hazardous chemical neutralization tables, or campus evacuation protocols. 

The SentinelX RAG system serves as an **Authoritative Grounded Knowledge Assistant**. Responders query operational procedures (e.g., *"How do we contain a sulfuric acid spill in Science Hall Room 302?"*) and receive concise step-by-step guidance accompanied by direct document citations and emergency contact numbers.

---

## 2. Technical Stack

| Component | Technology | Rationale |
|---|---|---|
| **Vector Database** | **Qdrant** | High-performance Rust-based vector search engine with native HNSW indexing, payload filtering by campus zone/hazard class, and low-latency REST/gRPC interfaces. |
| **Embeddings** | `sentence-transformers/all-MiniLM-L6-v2` (or OpenAI `text-embedding-3-small`) | Dense 384/1536-dimensional embeddings capturing semantic intent across emergency jargon. |
| **Chunking Engine** | Recursive Character Text Splitter (500 tokens, 100 token overlap) | Preserves semantic continuity across paragraph boundaries in safety manuals. |
| **LLM Inference** | Pluggable (vLLM / Ollama local llama-3-8b, or OpenAI GPT-4o-mini) | Strict temperature ($T=0.0$) with system prompts prohibiting extrapolation. |

---

## 3. Grounded Retrieval Pipeline

```
 Emergency Query: "Procedure for chemical spill in Chemistry Lab"
                         │
                         ▼
        ┌─────────────────────────────────┐
        │ Compute Query Embedding Vector  │
        │ e.g., 384-dim dense vector      │
        └────────────────┬────────────────┘
                         │
                         ▼
        ┌─────────────────────────────────┐
        │  Qdrant Vector Similarity Search │
        │  Filter: category == 'HAZMAT'   │
        │  Top-K = 3, Metric: Cosine      │
        └────────────────┬────────────────┘
                         │
                         ▼  Top Context Chunks & Metadata
        ┌─────────────────────────────────────────────────────────┐
        │ Prompt Construction with Grounding Guardrails           │
        │ "Answer ONLY using the provided excerpts. If the SOP    │
        │ does not specify, state 'No grounded procedure found'." │
        └────────────────┬────────────────────────────────────────┘
                         │
                         ▼
        ┌─────────────────────────────────┐
        │ Strict Zero-Temperature LLM     │
        └────────────────┬────────────────┘
                         │
                         ▼
   Structured Output with Verbatim Sources & Action Items
   - Answer
   - Sources: [Title, Page, Section, Revision Date]
   - Confidence Score
```

---

## 4. Qdrant Payload & Collection Schema

Collection name: `campus_sop_knowledge_base`

```json
{
  "id": "c4b9e18b-592f-410a-bdf4-f90352efce11",
  "vector": [0.0381, -0.0124, 0.0891, "...384 dimensions"],
  "payload": {
    "doc_id": "SOP-HAZ-2024-03",
    "title": "Hazardous Chemical Neutralization Manual",
    "facility": "Science and Engineering Complex",
    "hazard_class": "HAZMAT",
    "section": "Section 4.2: Acid Spills Under 5 Liters",
    "content": "1. Evacuate room immediately and seal doors. 2. Ensure responders wear Level B PPE. 3. Apply sodium bicarbonate neutralizer from kit H-4 located outside Rm 302.",
    "updated_at": "2026-01-15T08:00:00Z"
  }
}
```

---

## 5. Anti-Hallucination Guardrails

1. **Zero-Temperature Generation ($T = 0.0$)**: Eliminates creative sampling; forces deterministic next-token selection based purely on provided context.
2. **Context Presence Check**: If Qdrant returns vector matches with cosine similarity below the minimum threshold ($< 0.65$), retrieval aborts early and responds:
   > *"No verified standard operating procedure found in the campus emergency database for this query. Immediately notify Campus EHS Officer."*
3. **Mandatory Citation Verification**: The response pipeline parses the generated output to confirm that any cited document ID matches one of the retrieved chunks.
