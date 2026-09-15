import re
from typing import Optional, Tuple
from src.schemas import IncidentCategoryEnum, IncidentSeverityEnum

class RuleBasedSafetyGuardrail:
    """
    Deterministic Safety Guardrail (Section 11).
    Rule: AI models are probabilistic and must NEVER blindly control critical life-safety decisions.
    Any incident matching high-danger patterns is unconditionally escalated to CRITICAL/HIGH
    with deterministic protocol recommendations.
    """

    CRITICAL_SECURITY_PATTERNS = [
        r"\b(gun|gunshot|shooter|weapon|bomb|hostage|stabbing|knife|terror)\b"
    ]

    CRITICAL_FIRE_PATTERNS = [
        r"\b(explosion|flames|trapped.*fire|massive fire|chemical explosion)\b"
    ]

    HIGH_FIRE_PATTERNS = [
        r"\b(smoke|fire alarm|burning|fire)\b"
    ]

    CRITICAL_MEDICAL_PATTERNS = [
        r"\b(cardiac|unconscious|not breathing|overdose|seizure|severe bleeding|defibrillator|cpr)\b"
    ]

    HAZMAT_PATTERNS = [
        r"\b(gas leak|acid spill|radiation|cyanide|chlorine|toxic fume|chemical spill)\b"
    ]

    def evaluate_override(self, title: str, description: str) -> Optional[Tuple[IncidentCategoryEnum, IncidentSeverityEnum, str, list[str]]]:
        text = f"{title} {description}".lower()

        # 1. Critical Active Threat / Security
        for pattern in self.CRITICAL_SECURITY_PATTERNS:
            if re.search(pattern, text):
                return (
                    IncidentCategoryEnum.SECURITY,
                    IncidentSeverityEnum.CRITICAL,
                    "Safety rule applied: Immediate active violent threat / weapon detected",
                    [
                        "Initiate campus lockdown protocol immediately",
                        "Dispatch armed campus police and notify metropolitan SWAT",
                        "Broadcast campus emergency alert siren and push notifications",
                        "Seal building access perimeters"
                    ]
                )

        # 2. Critical Fire / Explosion
        for pattern in self.CRITICAL_FIRE_PATTERNS:
            if re.search(pattern, text):
                return (
                    IncidentCategoryEnum.FIRE,
                    IncidentSeverityEnum.CRITICAL,
                    "Safety rule applied: Catastrophic fire or explosion detected with life entrapment risk",
                    [
                        "Dispatch fire suppression units and hazmat engines",
                        "Trigger building-wide emergency fire alarm and strobe horns",
                        "Initiate immediate vertical evacuation",
                        "Activate automated HVAC smoke purge and zone dampers"
                    ]
                )

        # 3. High Fire
        for pattern in self.HIGH_FIRE_PATTERNS:
            if re.search(pattern, text):
                return (
                    IncidentCategoryEnum.FIRE,
                    IncidentSeverityEnum.HIGH,
                    "Safety rule applied: Active fire or smoke reported",
                    [
                        "Dispatch local campus fire warden squad",
                        "Verify manual pull stations and evacuation corridors",
                        "Notify facility maintenance to inspect ventilation ducts"
                    ]
                )

        # 4. Critical Medical
        for pattern in self.CRITICAL_MEDICAL_PATTERNS:
            if re.search(pattern, text):
                return (
                    IncidentCategoryEnum.MEDICAL,
                    IncidentSeverityEnum.CRITICAL,
                    "Safety rule applied: Acute life-threatening medical emergency detected",
                    [
                        "Dispatch advanced life support (ALS) paramedic team with AED",
                        "Instruct reporting caller on bystander CPR / direct pressure",
                        "Designate ground guide at building entrance for ambulance escort"
                    ]
                )

        # 5. Hazmat / Toxic Exposure
        for pattern in self.HAZMAT_PATTERNS:
            if re.search(pattern, text):
                return (
                    IncidentCategoryEnum.HAZMAT,
                    IncidentSeverityEnum.HIGH,
                    "Safety rule applied: Hazardous material / airborne toxic substance identified",
                    [
                        "Dispatch specialized hazmat response team in Level B suits",
                        "Isolate room and shut down localized recirculating airflow",
                        "Establish 100-meter exclusion perimeter upwind"
                    ]
                )

        return None
