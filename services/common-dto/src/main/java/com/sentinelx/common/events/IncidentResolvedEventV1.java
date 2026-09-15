package com.sentinelx.common.events;

public class IncidentResolvedEventV1 extends BaseEvent<IncidentResolvedPayload> {

    public static final String EVENT_TYPE = "incident.resolved";
    public static final int EVENT_VERSION = 1;

    public IncidentResolvedEventV1() {
        super();
        setEventType(EVENT_TYPE);
        setEventVersion(EVENT_VERSION);
    }

    public IncidentResolvedEventV1(String aggregateId, String traceId, IncidentResolvedPayload payload) {
        super(EVENT_TYPE, EVENT_VERSION, aggregateId, traceId, payload);
    }
}
