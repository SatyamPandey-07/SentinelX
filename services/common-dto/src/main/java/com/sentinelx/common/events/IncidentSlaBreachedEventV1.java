package com.sentinelx.common.events;

public class IncidentSlaBreachedEventV1 extends BaseEvent<IncidentSlaEventPayload> {

    public static final String EVENT_TYPE = "incident.sla.breached";
    public static final int EVENT_VERSION = 1;

    public IncidentSlaBreachedEventV1() {
        super();
        setEventType(EVENT_TYPE);
        setEventVersion(EVENT_VERSION);
    }

    public IncidentSlaBreachedEventV1(String aggregateId, String traceId, IncidentSlaEventPayload payload) {
        super(EVENT_TYPE, EVENT_VERSION, aggregateId, traceId, payload);
    }
}
