package com.sentinelx.notification.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Multi-channel dispatcher (Section 17/23).
 *
 * Email is a genuine SMTP integration against the Mailhog instance already
 * provisioned in docker-compose (localhost:8025 UI, localhost:1025 SMTP) —
 * messages sent here are real and inspectable there.
 *
 * SMS and push are intentionally left as logged simulations: sending them
 * for real would mean wiring paid third-party APIs (Twilio, FCM) that
 * require credentials this project has no legitimate way to provision, and
 * no local emulator for either is provisioned in docker-compose the way
 * Mailhog is for SMTP. Faking a "real" Twilio/FCM client against no backing
 * service would be exactly the kind of misleading integration this project
 * explicitly avoids, so those channels stay clearly labeled as simulated
 * until real credentials/emulators are available.
 *
 * A dispatch failure is allowed to propagate: the Kafka listener that calls
 * this rethrows it, which the consumer's DefaultErrorHandler (see
 * KafkaConsumerConfig) turns into exponential-backoff retries and, after
 * exhaustion, a DLQ publish — so a Mailhog outage never silently drops a
 * notification.
 */
@Service
public class NotificationDispatcher {

    private static final Logger log = LoggerFactory.getLogger(NotificationDispatcher.class);

    private final JavaMailSender mailSender;
    private final String fromAddress;

    public NotificationDispatcher(
            JavaMailSender mailSender,
            @Value("${notification.email.from:alerts@sentinelx.local}") String fromAddress) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
    }

    public void dispatchEmail(String recipient, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(recipient);
        message.setSubject(subject);
        message.setText(body);

        mailSender.send(message);
        log.info("[NOTIFICATION EMAIL] Sent via SMTP to {} | Subject: '{}'", recipient, subject);
    }

    public void dispatchSms(String phoneNumber, String message) {
        log.info("[NOTIFICATION SMS - SIMULATED, no SMS provider configured] To: {} | Message: '{}'", phoneNumber, message);
    }

    public void dispatchPushAlert(String targetTopic, String title, String payload) {
        log.info("[NOTIFICATION PUSH - SIMULATED, no push provider configured] Topic: {} | Title: '{}' | Payload: '{}'", targetTopic, title, payload);
    }
}
