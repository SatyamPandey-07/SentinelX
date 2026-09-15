import os
import json
import logging
from typing import Optional

import anthropic

from src.schemas import ClassificationResponse, IncidentCategoryEnum, IncidentSeverityEnum
from src.classifier.base import BaseClassifier
from src.classifier.ml_classifier import MLClassifier
from src.classifier.rule_guardrail import RuleBasedSafetyGuardrail

logger = logging.getLogger(__name__)

MODEL = "claude-haiku-4-5"

CLASSIFICATION_SCHEMA = {
    "type": "object",
    "properties": {
        "category": {"type": "string", "enum": [c.value for c in IncidentCategoryEnum]},
        "severity": {"type": "string", "enum": [s.value for s in IncidentSeverityEnum]},
        "confidence": {"type": "number", "minimum": 0.0, "maximum": 1.0},
        "reasoning": {"type": "string"},
        "recommended_actions": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["category", "severity", "confidence", "reasoning", "recommended_actions"],
    "additionalProperties": False,
}

SYSTEM_PROMPT = (
    "You are an emergency incident triage assistant for a campus safety platform. "
    "Read the reported incident and classify it into exactly one category and severity. "
    "Be conservative: when uncertain about severity, prefer the higher severity. "
    "Recommended actions should be concrete, campus-safety-specific next steps."
)


class LLMClassifier(BaseClassifier):
    """
    LLM-backed classifier (Section 11/12), using Claude Haiku 4.5 — chosen
    for classification's low-latency, low-cost profile (Section 44 targets
    AI response < 1.5s) rather than a heavier reasoning model.

    Safety-critical design (Section 11): the deterministic rule-based
    guardrail runs FIRST and unconditionally wins on any high-danger
    pattern match, exactly as in MLClassifier. The LLM is never the sole
    authority on a life-safety classification — it only reasons about
    incidents the guardrail didn't already flag as critical.

    Failure handling (Section 23): if no API key is configured, or the call
    fails for any reason (timeout, rate limit, malformed output), this
    transparently falls back to MLClassifier's statistical scoring rather
    than failing the request. "AI service unavailable" must never make an
    incident disappear.
    """

    def __init__(self):
        self.fallback = MLClassifier()
        self.guardrail = RuleBasedSafetyGuardrail()
        api_key = os.getenv("ANTHROPIC_API_KEY", "")
        if api_key:
            self.client = anthropic.Anthropic(api_key=api_key).with_options(timeout=8.0, max_retries=1)
        else:
            self.client = None

    def classify(self, title: str, description: str, category_hint: Optional[str] = None) -> ClassificationResponse:
        override = self.guardrail.evaluate_override(title, description)
        if override is not None:
            cat, sev, reason, actions = override
            return ClassificationResponse(
                category=cat,
                severity=sev,
                confidence=1.0,
                reasoning=reason,
                recommended_actions=actions,
                safety_rule_applied=True,
            )

        if self.client is None:
            logger.info("ANTHROPIC_API_KEY not configured; using keyword classifier fallback.")
            return self.fallback.classify(title, description, category_hint)

        try:
            return self._classify_with_llm(title, description, category_hint)
        except Exception as e:
            logger.warning(
                "LLM classification failed (%s: %s); falling back to keyword classifier.",
                type(e).__name__, e,
            )
            return self.fallback.classify(title, description, category_hint)

    def _classify_with_llm(self, title: str, description: str, category_hint: Optional[str]) -> ClassificationResponse:
        hint_text = f"\nReporter-supplied category hint: {category_hint}" if category_hint else ""
        response = self.client.messages.create(
            model=MODEL,
            max_tokens=500,
            system=SYSTEM_PROMPT,
            messages=[{
                "role": "user",
                "content": f"Incident title: {title}\nDescription: {description}{hint_text}",
            }],
            output_config={"format": {"type": "json_schema", "schema": CLASSIFICATION_SCHEMA}},
        )

        text = next(b.text for b in response.content if b.type == "text")
        data = json.loads(text)

        return ClassificationResponse(
            category=IncidentCategoryEnum(data["category"]),
            severity=IncidentSeverityEnum(data["severity"]),
            confidence=float(data["confidence"]),
            reasoning=data["reasoning"],
            recommended_actions=data["recommended_actions"],
            safety_rule_applied=False,
        )
