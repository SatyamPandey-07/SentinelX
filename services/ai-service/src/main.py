import os
import time
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response

from src.schemas import (
    ClassificationRequest,
    ClassificationResponse,
    RagQueryRequest,
    RagQueryResponse,
    SummarizationRequest,
    SummarizationResponse
)
from src.classifier.ml_classifier import MLClassifier
from src.classifier.llm_classifier import LLMClassifier
from src.classifier.groq_classifier import GroqClassifier
from src.rag.rag_engine import RagEngine

logger = logging.getLogger(__name__)

app = FastAPI(
    title="SentinelX AI & Grounded RAG Service",
    description="Emergency classification, deterministic safety guardrails, and policy assistant",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Metrics (Section 21)
CLASSIFICATION_REQUESTS = Counter("ai_classification_requests_total", "Total classification requests", ["category", "severity"])
CLASSIFICATION_LATENCY = Histogram("ai_classification_duration_seconds", "Classification latency in seconds")
SAFETY_OVERRIDES_COUNT = Counter("ai_safety_overrides_total", "Total rule-based safety overrides triggered")

# Provider selection (Section 12): swappable classifier abstraction — the
# app is not coupled to one LLM vendor. AI_CLASSIFIER_PROVIDER=ml|anthropic|groq|auto
# (default auto: prefer Anthropic if ANTHROPIC_API_KEY is set, else Groq if
# GROQ_API_KEY is set, else the deterministic keyword classifier). Whichever
# LLM provider is chosen, it internally falls back to MLClassifier on any
# call failure — see llm_classifier.py / groq_classifier.py.
_provider = os.getenv("AI_CLASSIFIER_PROVIDER", "auto").lower()
if _provider == "ml":
    classifier = MLClassifier()
elif _provider == "anthropic":
    classifier = LLMClassifier()
elif _provider == "groq":
    classifier = GroqClassifier()
elif _provider == "auto" and os.getenv("ANTHROPIC_API_KEY"):
    classifier = LLMClassifier()
elif _provider == "auto" and os.getenv("GROQ_API_KEY"):
    classifier = GroqClassifier()
else:
    classifier = MLClassifier()
logger.info("ai-service classifier provider: %s", type(classifier).__name__)

rag_engine = RagEngine()

@app.post("/api/v1/ai/classify", response_model=ClassificationResponse)
def classify_incident(request: ClassificationRequest):
    start_time = time.time()
    result = classifier.classify(
        title=request.title,
        description=request.description,
        category_hint=request.category_hint
    )
    duration = time.time() - start_time
    CLASSIFICATION_LATENCY.observe(duration)
    CLASSIFICATION_REQUESTS.labels(category=result.category.value, severity=result.severity.value).inc()

    if result.safety_rule_applied:
        SAFETY_OVERRIDES_COUNT.inc()

    return result

@app.post("/api/v1/ai/rag/query", response_model=RagQueryResponse)
def query_rag(request: RagQueryRequest):
    return rag_engine.query(request)

@app.post("/api/v1/ai/summarize", response_model=SummarizationResponse)
def summarize_incident(request: SummarizationRequest):
    summary = f"Incident {request.incident_id} recorded {len(request.events_log)} progression updates. Key actions involved emergency triage and containment."
    return SummarizationResponse(
        incident_id=request.incident_id,
        executive_summary=summary,
        key_timeline_points=request.events_log[:5]
    )

@app.get("/health")
def health_check():
    return {
        "status": "UP",
        "service": "ai-service",
        "timestamp": time.time(),
        "models": {
            "classifier": type(classifier).__name__,
            "safety_guardrails": "enforced",
            "rag_vector_store": "ready"
        }
    }

@app.get("/metrics")
def metrics():
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=False)
