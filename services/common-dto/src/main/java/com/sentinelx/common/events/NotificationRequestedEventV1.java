package com.sentinelx.common.events;

public class NotificationRequestedEventV1 extends BaseEvent<NotificationRequestedPayload> {

    public static final String EVENT_TYPE = "notification.requested";
    public static final int EVENT_VERSION = 1;

    public NotificationRequestedEventV1() {
        super();
        setEventType(EVENT_TYPE);
        setEventVersion(EVENT_VERSION);
    }

    public NotificationRequestedEventV1(String aggregateId, String traceId, NotificationRequestedPayload payload) {
        super(EVENT_TYPE, EVENT_VERSION, aggregateId, traceId, payload);
    }
}
