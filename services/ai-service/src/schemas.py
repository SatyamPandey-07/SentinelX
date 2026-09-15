from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum

class IncidentCategoryEnum(str, Enum):
    FIRE = "FIRE"
    MEDICAL = "MEDICAL"
    SECURITY = "SECURITY"
    HAZMAT = "HAZMAT"
    INFRASTRUCTURE = "INFRASTRUCTURE"
    ELECTRICAL = "ELECTRICAL"
    SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY"
    HARASSMENT = "HARASSMENT"
    THEFT = "THEFT"
    NATURAL_DISASTER = "NATURAL_DISASTER"
    EQUIPMENT_FAILURE = "EQUIPMENT_FAILURE"
    OTHER = "OTHER"

class IncidentSeverityEnum(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class ClassificationRequest(BaseModel):
    incident_id: Optional[str] = None
    title: str = Field(..., min_length=3, description="Incident title or subject")
    description: str = Field(..., min_length=5, description="Full description of the emergency")
    category_hint: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class ClassificationResponse(BaseModel):
    category: IncidentCategoryEnum
    severity: IncidentSeverityEnum
    confidence: float
    reasoning: str
    recommended_actions: List[str]
    safety_rule_applied: bool = False

class RagCitation(BaseModel):
    document_name: str
    section: str
    content: str
    relevance_score: float

class RagQueryRequest(BaseModel):
    query: str = Field(..., min_length=3)
    incident_category: Optional[str] = None
    max_citations: int = 3

class RagQueryResponse(BaseModel):
    answer: str
    citations: List[RagCitation]
    confidence: float
    disclaimer: str = "This guidance is generated from official campus emergency procedures. Always prioritize human life and follow dispatcher commands."

class SummarizationRequest(BaseModel):
    incident_id: str
    events_log: List[str]

class SummarizationResponse(BaseModel):
    incident_id: str
    executive_summary: str
    key_timeline_points: List[str]
