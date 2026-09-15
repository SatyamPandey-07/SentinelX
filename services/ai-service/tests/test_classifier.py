import pytest
from src.classifier.ml_classifier import MLClassifier
from src.schemas import IncidentCategoryEnum, IncidentSeverityEnum

@pytest.fixture
def classifier():
    return MLClassifier()

def test_critical_security_guardrail_override(classifier):
    res = classifier.classify(
        title="Active shooter reported",
        description="Individual with a weapon seen near library west wing"
    )
    assert res.category == IncidentCategoryEnum.SECURITY
    assert res.severity == IncidentSeverityEnum.CRITICAL
    assert res.safety_rule_applied is True
    assert res.confidence == 1.0
    assert any("lockdown" in a.lower() for a in res.recommended_actions)

def test_critical_fire_guardrail_override(classifier):
    res = classifier.classify(
        title="Explosion in chemistry lab",
        description="Massive fire and explosion in room 304, people trapped"
    )
    assert res.category == IncidentCategoryEnum.FIRE
    assert res.severity == IncidentSeverityEnum.CRITICAL
    assert res.safety_rule_applied is True
    assert any("evacuation" in a.lower() for a in res.recommended_actions)

def test_critical_medical_guardrail_override(classifier):
    res = classifier.classify(
        title="Student collapsed",
        description="Person is unconscious and not breathing on sports field, starting CPR"
    )
    assert res.category == IncidentCategoryEnum.MEDICAL
    assert res.severity == IncidentSeverityEnum.CRITICAL
    assert res.safety_rule_applied is True
    assert any("aed" in a.lower() or "paramedic" in a.lower() for a in res.recommended_actions)

def test_routine_infrastructure_classification(classifier):
    res = classifier.classify(
        title="Water leak in restroom",
        description="Pipe leaking underneath sink in 2nd floor bathroom"
    )
    assert res.category == IncidentCategoryEnum.INFRASTRUCTURE
    assert res.severity in (IncidentSeverityEnum.LOW, IncidentSeverityEnum.MEDIUM)
    assert res.safety_rule_applied is False
