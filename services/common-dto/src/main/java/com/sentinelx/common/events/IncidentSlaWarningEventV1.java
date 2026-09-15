package com.sentinelx.common.events;

public class IncidentSlaWarningEventV1 extends BaseEvent<IncidentSlaEventPayload> {

    public static final String EVENT_TYPE = "incident.sla.warning";
    public static final int EVENT_VERSION = 1;

    public IncidentSlaWarningEventV1() {
        super();
        setEventType(EVENT_TYPE);
        setEventVersion(EVENT_VERSION);
    }

    public IncidentSlaWarningEventV1(String aggregateId, String traceId, IncidentSlaEventPayload payload) {
        super(EVENT_TYPE, EVENT_VERSION, aggregateId, traceId, payload);
    }
}
