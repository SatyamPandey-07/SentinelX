package com.sentinelx.common.events;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.UUID;

public abstract class BaseEvent<T> {

    @JsonProperty("event_id")
    private String eventId;

    @JsonProperty("event_type")
    private String eventType;

    @JsonProperty("event_version")
    private int eventVersion;

    @JsonProperty("timestamp")
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Instant timestamp;

    @JsonProperty("trace_id")
    private String traceId;

    @JsonProperty("aggregate_id")
    private String aggregateId;

    @JsonProperty("payload")
    private T payload;

    public BaseEvent() {
        this.eventId = UUID.randomUUID().toString();
        this.timestamp = Instant.now();
    }

    public BaseEvent(String eventType, int eventVersion, String aggregateId, String traceId, T payload) {
        this.eventId = UUID.randomUUID().toString();
        this.eventType = eventType;
        this.eventVersion = eventVersion;
        this.aggregateId = aggregateId;
        this.traceId = traceId;
        this.timestamp = Instant.now();
        this.payload = payload;
    }

    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public int getEventVersion() {
        return eventVersion;
    }

    public void setEventVersion(int eventVersion) {
        this.eventVersion = eventVersion;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public String getTraceId() {
        return traceId;
    }

    public void setTraceId(String traceId) {
        this.traceId = traceId;
    }

    public String getAggregateId() {
        return aggregateId;
    }

    public void setAggregateId(String aggregateId) {
        this.aggregateId = aggregateId;
    }

    public T getPayload() {
        return payload;
    }

    public void setPayload(T payload) {
        this.payload = payload;
    }
}
