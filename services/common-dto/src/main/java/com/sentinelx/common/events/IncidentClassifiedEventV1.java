package com.sentinelx.common.events;

public class IncidentClassifiedEventV1 extends BaseEvent<IncidentClassifiedPayload> {

    public static final String EVENT_TYPE = "incident.classified";
    public static final int EVENT_VERSION = 1;

    public IncidentClassifiedEventV1() {
        super();
        setEventType(EVENT_TYPE);
        setEventVersion(EVENT_VERSION);
    }

    public IncidentClassifiedEventV1(String aggregateId, String traceId, IncidentClassifiedPayload payload) {
        super(EVENT_TYPE, EVENT_VERSION, aggregateId, traceId, payload);
    }
}
