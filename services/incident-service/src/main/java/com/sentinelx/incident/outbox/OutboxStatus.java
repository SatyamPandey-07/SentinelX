package com.sentinelx.incident.outbox;

public enum OutboxStatus {
    PENDING,
    IN_PROGRESS,
    PUBLISHED,
    FAILED
}
