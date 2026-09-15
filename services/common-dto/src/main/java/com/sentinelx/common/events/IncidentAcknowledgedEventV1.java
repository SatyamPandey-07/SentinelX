package com.sentinelx.common.events;

public class IncidentAcknowledgedEventV1 extends BaseEvent<IncidentAcknowledgedPayload> {

    public static final String EVENT_TYPE = "incident.acknowledged";
    public static final int EVENT_VERSION = 1;

    public IncidentAcknowledgedEventV1() {
        super();
        setEventType(EVENT_TYPE);
        setEventVersion(EVENT_VERSION);
    }

    public IncidentAcknowledgedEventV1(String aggregateId, String traceId, IncidentAcknowledgedPayload payload) {
        super(EVENT_TYPE, EVENT_VERSION, aggregateId, traceId, payload);
    }
}
