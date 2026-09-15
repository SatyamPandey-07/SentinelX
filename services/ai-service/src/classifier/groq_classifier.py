import os
import json
import logging
from typing import Optional

from groq import Groq

from src.schemas import ClassificationResponse, IncidentCategoryEnum, IncidentSeverityEnum
from src.classifier.base import BaseClassifier
from src.classifier.ml_classifier import MLClassifier
from src.classifier.rule_guardrail import RuleBasedSafetyGuardrail

logger = logging.getLogger(__name__)

# gpt-oss-20b: Groq's recommended low-latency replacement for the deprecated
# llama-3.1-8b-instant tier — fits classification's <1.5s target (Section 44)
# better than a larger reasoning model would.
MODEL = "openai/gpt-oss-20b"

SYSTEM_PROMPT_TEMPLATE = (
    "You are an emergency incident triage assistant for a campus safety platform. "
    "Classify the incident into exactly one category and severity. Be conservative: "
    "when uncertain about severity, prefer the higher severity. "
    "Respond with ONLY a JSON object, no markdown fences, no extra text, matching exactly:\n"
    '{{"category": "<one of: {categories}>", "severity": "<one of: {severities}>", '
    '"confidence": <0.0-1.0>, "reasoning": "<string>", "recommended_actions": ["<string>", ...]}}'
)


class GroqClassifier(BaseClassifier):
    """
    LLM-backed classifier using Groq's fast inference API (Section 12: the
    classifier is deliberately provider-swappable — see LLMClassifier for
    the Anthropic/Claude equivalent, selectable via AI_CLASSIFIER_PROVIDER).
    Groq's low per-token latency fits the AI response < 1.5s target
    (Section 44) especially well.

    Same safety contract as LLMClassifier (Section 11/23): the deterministic
    guardrail runs first and unconditionally wins on high-danger patterns;
    a missing key or any call failure (timeout, malformed JSON, rate limit)
    falls back to MLClassifier's statistical scoring rather than failing
    the request.
    """

    def __init__(self):
        self.fallback = MLClassifier()
        self.guardrail = RuleBasedSafetyGuardrail()
        api_key = os.getenv("GROQ_API_KEY", "")
        self.client = Groq(api_key=api_key, timeout=8.0, max_retries=1) if api_key else None

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
            logger.info("GROQ_API_KEY not configured; using keyword classifier fallback.")
            return self.fallback.classify(title, description, category_hint)

        try:
            return self._classify_with_groq(title, description, category_hint)
        except Exception as e:
            logger.warning(
                "Groq classification failed (%s: %s); falling back to keyword classifier.",
                type(e).__name__, e,
            )
            return self.fallback.classify(title, description, category_hint)

    def _classify_with_groq(self, title: str, description: str, category_hint: Optional[str]) -> ClassificationResponse:
        hint_text = f"\nReporter-supplied category hint: {category_hint}" if category_hint else ""
        categories = ", ".join(c.value for c in IncidentCategoryEnum)
        severities = ", ".join(s.value for s in IncidentSeverityEnum)
        system_prompt = SYSTEM_PROMPT_TEMPLATE.format(categories=categories, severities=severities)

        completion = self.client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Incident title: {title}\nDescription: {description}{hint_text}"},
            ],
            response_format={"type": "json_object"},
            max_tokens=500,
            temperature=0.2,
        )

        text = completion.choices[0].message.content
        data = json.loads(text)

        return ClassificationResponse(
            category=IncidentCategoryEnum(data["category"]),
            severity=IncidentSeverityEnum(data["severity"]),
            confidence=float(data["confidence"]),
            reasoning=data["reasoning"],
            recommended_actions=data["recommended_actions"],
            safety_rule_applied=False,
        )
