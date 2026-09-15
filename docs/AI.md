# SentinelX - AI Classification & Intelligence Architecture

## 1. Executive Overview

In the SentinelX Distributed Emergency Response Platform, Artificial Intelligence is treated as an **advisory intelligence layer**, never an unchecked operational authority. Emergency response systems cannot afford hallucination, probabilistic latency spikes, or non-deterministic classifications when life safety, hazardous materials, or campus infrastructure are at risk.

The **AI Service** (`services/ai-service`) is implemented in **Python 3.10+ with FastAPI** to leverage native PyTorch, HuggingFace, and vector database ecosystems while exposing both high-speed REST and internal gRPC endpoints for microservice communication.

---

## 2. Core Architectural Principles

1. **Deterministic Safety Override Over Probabilistic Inference**:
   - Probabilistic LLMs or classifier models have nonzero error rates.
   - Deterministic regular expression and keyword-rule safety nets evaluate incident descriptions *before* and *in tandem with* machine learning models.
   - High-consequence safety triggers (e.g., active active shooter, structural collapse, explosion, cardiac arrest) trigger **hard-coded CRITICAL priority** overrides with guaranteed confidence `1.0`, regardless of model confidence.

2. **Provider Agnosticism via Strategy Pattern**:
   - Classifiers adhere to an abstract base class (`ClassifierStrategy`).
   - The system easily swaps between offline statistical models (`MLClassifier` via scikit-learn / local BERT), direct LLM integrations (`LLMClassifier` via OpenAI, Anthropic, or local vLLM / Ollama), and Mock test harnesses without refactoring consumers.

3. **Grounded Retrieval-Augmented Generation (RAG)**:
   - Responders need instant access to SOPs (Standard Operating Procedures), chemical safety datasheets (MSDS), evacuation maps, and building layout manuals.
   - RAG responses must provide verbatim source citations and section references. If a requested procedure is missing from the indexed knowledge base, the model explicitly states that no grounded SOP was found rather than inventing one.

---

## 3. Incident Classification Pipeline

```
              ┌───────────────────────────────────────────────┐
              │ Incoming Incident: Description + Hints        │
              └───────────────────────┬───────────────────────┘
                                      │
                                      ▼
                      ┌───────────────────────────────┐
                      │  Rule-Based Safety Guardrails │
                      └───────────────┬───────────────┘
                                      │
                    Matched Critical Threat Trigger?
                                    /   \
                             YES   /     \   NO
                                  /       \
                                 ▼         ▼
        ┌────────────────────────────┐    ┌────────────────────────────┐
        │ Hard-Coded Safety Override │    │ ML/LLM Ensemble Classifier │
        │ Severity: CRITICAL         │    │ Category + Severity Score  │
        │ Confidence: 1.0            │    │ Action Recommendations     │
        └──────────────┬─────────────┘    └─────────────┬──────────────┘
                       │                                │
                       └──────────────┬─────────────────┘
                                      │
                                      ▼
                      ┌───────────────────────────────┐
                      │ Output Structured AI Contract │
                      │ - Category                    │
                      │ - Severity                    │
                      │ - Confidence & Reasoning      │
                      │ - Recommended Actions         │
                      └───────────────────────────────┘
```

### Classification Safety Guardrails (`rule_guardrails.py`)
Deterministic rules parse for high-risk hazards:
- **FIRE**: `smoke`, `fire`, `explosion`, `burning`, `flames` -> Severity `CRITICAL`, Category `FIRE`.
- **MEDICAL**: `unconscious`, `cardiac arrest`, `bleeding heavily`, `overdose` -> Severity `CRITICAL`, Category `MEDICAL`.
- **SECURITY**: `gunshot`, `active shooter`, `hostage`, `bomb threat` -> Severity `CRITICAL`, Category `SECURITY`.
- **HAZMAT**: `gas leak`, `chemical spill`, `cyanide`, `radiation` -> Severity `CRITICAL`, Category `INFRASTRUCTURE`.

If a safety trigger is hit:
```json
{
  "category": "FIRE",
  "severity": "CRITICAL",
  "confidence": 1.0,
  "reasoning": "DETERMINISTIC SAFETY OVERRIDE: Matched high-consequence hazard pattern: 'explosion'",
  "recommended_actions": [
    "Evacuate immediate sector",
    "Dispatch Fire & Rescue team",
    "Cut HVAC air circulation in affected wing"
  ],
  "similar_incident_ids": []
}
```

---

## 4. Duplicate Incident Detection

In campus emergencies (e.g., a transformer explosion on Central Quad), hundreds of calls and submissions arrive simultaneously. Processing them as separate incidents exhausts responders and clutters dispatch queues.

The duplicate detection engine calculates a composite similarity index:

$$Score = (w_{text} \cdot Sim_{text}) + (w_{geo} \cdot Sim_{geo}) + (w_{time} \cdot Sim_{time})$$

Where:
- $Sim_{text}$: Cosine similarity between embedding vectors (or token overlap Jaccard index) $\ge 0.70$.
- $Sim_{geo}$: Haversine geographic proximity $\le 150 \text{ meters}$.
- $Sim_{time}$: Window $\le 10 \text{ minutes}$ from initial reported incident.

If $Score \ge 0.82$, the incoming submission is flagged as a duplicate candidate, linked to the parent incident ID, and responders are notified without spawning duplicate dispatch events.

---

## 5. Performance and Latency Budgets

- **Safety Guardrail Evaluation**: $< 2\text{ms}$
- **Local ML Classification**: $< 45\text{ms}$
- **LLM Zero-Shot (External/Local vLLM)**: $< 1200\text{ms}$ (with circuit breaker timeout at $2000\text{ms}$)
- **Fallback on AI Timeout**: If the AI model fails or times out, the `IncidentService` falls back to the client-submitted category and defaults severity to `HIGH` until human supervisor verification.
