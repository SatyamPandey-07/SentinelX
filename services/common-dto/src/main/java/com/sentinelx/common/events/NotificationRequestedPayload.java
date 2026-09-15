package com.sentinelx.common.events;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Map;

public record NotificationRequestedPayload(
    @JsonProperty("notification_id") String notificationId,
    @JsonProperty("recipient_id") String recipientId,
    @JsonProperty("channel") String channel,
    @JsonProperty("subject") String subject,
    @JsonProperty("body") String body,
    @JsonProperty("metadata") Map<String, String> metadata
) {}
