# ADR-012: Deterministic Safety Guardrails over Probabilistic AI Recommendations

## Status
Accepted

## Context
Machine Learning and LLMs are probabilistic models susceptible to hallucinations, low-confidence edge cases, or adversarial inputs. In life-critical emergency management, an AI model mistakenly classifying an active shooter as a noise disturbance or downplaying a toxic gas leak would lead to catastrophic casualties.

## Decision
Enforce strict architectural guardrails:
1. **Deterministic Safety Rules Override AI**: Any incident containing life-safety triggers (e.g., "gun", "explosion", "cardiac arrest", "acid spill") unconditionally triggers deterministic safety rules that escalate severity to `CRITICAL` or `HIGH` with predefined standard operating procedures (SOPs).
2. **AI as Advisor, Not Autocrat**: AI generates recommendations and drafts actions; human dispatchers retain override authority at all times.
3. **Grounded RAG Assistant**: Emergency policy guidance must cite official campus documentation with exact section numbers. The model is forbidden from fabricating emergency instructions.
4. **Outage Immunity**: If the AI service is unreachable, incident reporting proceeds normally with rule-based fallback categorization.

## Consequences
- **Positive**: Eliminates risk of automated life-safety failure caused by probabilistic AI misclassifications.
- **Tradeoff**: Rules must be reviewed and maintained by campus emergency planning staff.
