package com.sentinelx.notification.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class NotificationDispatcher {

    private static final Logger log = LoggerFactory.getLogger(NotificationDispatcher.class);

    public void dispatchEmail(String recipient, String subject, String body) {
        log.info("[NOTIFICATION EMAIL] To: {} | Subject: '{}' | Body: '{}'", recipient, subject, body);
    }

    public void dispatchSms(String phoneNumber, String message) {
        log.info("[NOTIFICATION SMS] To: {} | Message: '{}'", phoneNumber, message);
    }

    public void dispatchPushAlert(String targetTopic, String title, String payload) {
        log.info("[NOTIFICATION PUSH] Topic: {} | Title: '{}' | Payload: '{}'", targetTopic, title, payload);
    }
}
