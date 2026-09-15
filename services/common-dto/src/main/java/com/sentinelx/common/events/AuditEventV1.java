package com.sentinelx.common.events;

public class AuditEventV1 extends BaseEvent<AuditEventPayload> {

    public static final String EVENT_TYPE = "audit.event";
    public static final int EVENT_VERSION = 1;

    public AuditEventV1() {
        super();
        setEventType(EVENT_TYPE);
        setEventVersion(EVENT_VERSION);
    }

    public AuditEventV1(String aggregateId, String traceId, AuditEventPayload payload) {
        super(EVENT_TYPE, EVENT_VERSION, aggregateId, traceId, payload);
    }
}
