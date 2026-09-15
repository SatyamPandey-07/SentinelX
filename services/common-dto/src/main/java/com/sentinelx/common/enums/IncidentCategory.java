package com.sentinelx.common.enums;

public enum IncidentCategory {
    FIRE,
    MEDICAL,
    SECURITY,
    // Must stay in sync with ai-service's IncidentCategoryEnum
    // (services/ai-service/src/schemas.py) — its safety guardrail
    // (rule_guardrail.py) returns HAZMAT for gas leaks/chemical spills, and
    // an unmapped category from a cross-language classifier response would
    // throw IllegalArgumentException at IncidentCategory.valueOf(...).
    HAZMAT,
    INFRASTRUCTURE,
    ELECTRICAL,
    SUSPICIOUS_ACTIVITY,
    HARASSMENT,
    THEFT,
    NATURAL_DISASTER,
    EQUIPMENT_FAILURE,
    OTHER
}
