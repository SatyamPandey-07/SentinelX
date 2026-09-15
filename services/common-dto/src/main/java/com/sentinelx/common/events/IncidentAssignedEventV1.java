package com.sentinelx.common.events;

public class IncidentAssignedEventV1 extends BaseEvent<IncidentAssignedPayload> {

    public static final String EVENT_TYPE = "incident.assigned";
    public static final int EVENT_VERSION = 1;

    public IncidentAssignedEventV1() {
        super();
        setEventType(EVENT_TYPE);
        setEventVersion(EVENT_VERSION);
    }

    public IncidentAssignedEventV1(String aggregateId, String traceId, IncidentAssignedPayload payload) {
        super(EVENT_TYPE, EVENT_VERSION, aggregateId, traceId, payload);
    }
}
