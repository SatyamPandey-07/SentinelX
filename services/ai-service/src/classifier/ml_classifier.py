from typing import Optional, List, Dict
import math
from src.schemas import ClassificationResponse, IncidentCategoryEnum, IncidentSeverityEnum
from src.classifier.base import BaseClassifier
from src.classifier.rule_guardrail import RuleBasedSafetyGuardrail

class MLClassifier(BaseClassifier):
    """
    NLP & Heuristic Classifier with integrated Safety Guardrails.
    Combines vocabulary density, category profiles, and deterministic safety rules.
    """

    def __init__(self):
        self.guardrail = RuleBasedSafetyGuardrail()
        self.category_keywords: Dict[IncidentCategoryEnum, List[str]] = {
            IncidentCategoryEnum.FIRE: ["fire", "smoke", "burning", "alarm", "flame", "heater", "spark"],
            IncidentCategoryEnum.MEDICAL: ["fainted", "injury", "bleeding", "sick", "headache", "asthma", "allergy", "fracture"],
            IncidentCategoryEnum.SECURITY: ["fight", "trespass", "stalking", "unauthorized", "shouting", "threat", "assault"],
            IncidentCategoryEnum.INFRASTRUCTURE: ["leak", "pipe", "water", "flood", "ceiling", "elevator", "stuck", "plumbing"],
            IncidentCategoryEnum.ELECTRICAL: ["power outage", "blackout", "wiring", "short circuit", "voltage", "generator"],
            IncidentCategoryEnum.SUSPICIOUS_ACTIVITY: ["prowler", "loitering", "unattended bag", "drone", "suspicious vehicle"],
            IncidentCategoryEnum.THEFT: ["stolen", "burglary", "missing laptop", "broken locker", "bike theft"],
            IncidentCategoryEnum.NATURAL_DISASTER: ["earthquake", "tornado", "severe storm", "lightning", "falling tree"],
            IncidentCategoryEnum.EQUIPMENT_FAILURE: ["boiler", "server rack down", "cooling tower", "lab equipment fail", "chiller"]
        }

    def classify(self, title: str, description: str, category_hint: Optional[str] = None) -> ClassificationResponse:
        # Step 1: Check Deterministic Safety Guardrail (Highest Priority)
        override = self.guardrail.evaluate_override(title, description)
        if override is not None:
            cat, sev, reason, actions = override
            return ClassificationResponse(
                category=cat,
                severity=sev,
                confidence=1.0,
                reasoning=reason,
                recommended_actions=actions,
                safety_rule_applied=True
            )

        # Step 2: Statistical Category Scoring
        text = f"{title} {description}".lower()
        scores: Dict[IncidentCategoryEnum, float] = {}

        for cat, keywords in self.category_keywords.items():
            score = 0.0
            for kw in keywords:
                if kw in text:
                    score += 1.0 + (1.5 if kw in title.lower() else 0.0)
            scores[cat] = score

        # Incorporate category hint if supplied by user
        if category_hint:
            try:
                hint_cat = IncidentCategoryEnum(category_hint.upper())
                scores[hint_cat] = scores.get(hint_cat, 0.0) + 2.0
            except ValueError:
                pass

        # Select highest scoring category
        best_category = IncidentCategoryEnum.OTHER
        max_score = 0.0
        for cat, score in scores.items():
            if score > max_score:
                max_score = score
                best_category = cat

        # Calculate confidence using softmax-like normalization
        confidence = 0.50
        if max_score > 0:
            confidence = min(0.95, 0.60 + (max_score * 0.08))

        # Determine severity based on severity markers
        severity = self._estimate_severity(text, max_score)
        actions = self._generate_actions(best_category, severity)
        reasoning = f"Categorized as {best_category.value} with confidence {confidence:.2f} based on linguistic features."

        return ClassificationResponse(
            category=best_category,
            severity=severity,
            confidence=confidence,
            reasoning=reasoning,
            recommended_actions=actions,
            safety_rule_applied=False
        )

    def _estimate_severity(self, text: str, score: float) -> IncidentSeverityEnum:
        if any(w in text for w in ["urgent", "emergency", "danger", "immediately", "critical", "spreading"]):
            return IncidentSeverityEnum.HIGH
        elif any(w in text for w in ["moderate", "blocked", "disrupted", "damage", "flooding"]):
            return IncidentSeverityEnum.MEDIUM
        return IncidentSeverityEnum.LOW

    def _generate_actions(self, category: IncidentCategoryEnum, severity: IncidentSeverityEnum) -> List[str]:
        actions = []
        if severity in (IncidentSeverityEnum.HIGH, IncidentSeverityEnum.CRITICAL):
            actions.append("Alert campus dispatch and standby for priority routing")
        actions.append(f"Dispatch {category.value.lower().replace('_', ' ')} specialist team")
        actions.append("Log event coordinates and update digital campus perimeter map")
        return actions
