package com.sentinelx.common.enums;

public enum IncidentSeverity {
    LOW(1),
    MEDIUM(2),
    HIGH(3),
    CRITICAL(4);

    private final int level;

    IncidentSeverity(int level) {
        this.level = level;
    }

    public int getLevel() {
        return level;
    }
}
