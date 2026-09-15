package com.sentinelx.common.events;

public class IncidentCreatedEventV1 extends BaseEvent<IncidentCreatedPayload> {

    public static final String EVENT_TYPE = "incident.created";
    public static final int EVENT_VERSION = 1;

    public IncidentCreatedEventV1() {
        super();
        setEventType(EVENT_TYPE);
        setEventVersion(EVENT_VERSION);
    }

    public IncidentCreatedEventV1(String aggregateId, String traceId, IncidentCreatedPayload payload) {
        super(EVENT_TYPE, EVENT_VERSION, aggregateId, traceId, payload);
    }
}
