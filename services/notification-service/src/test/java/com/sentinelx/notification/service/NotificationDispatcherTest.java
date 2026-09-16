package com.sentinelx.notification.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * dispatchEmail is a real SMTP send (against Mailhog in docker-compose,
 * verified live earlier) -- this unit test covers the message-construction
 * contract and the failure-propagation guarantee the DLQ path depends on,
 * without needing a real SMTP server for every test run.
 */
class NotificationDispatcherTest {

    private JavaMailSender mailSender;
    private NotificationDispatcher dispatcher;

    @BeforeEach
    void setUp() {
        mailSender = mock(JavaMailSender.class);
        dispatcher = new NotificationDispatcher(mailSender, "alerts@sentinelx.local");
    }

    @Test
    void dispatchEmail_buildsMessageWithCorrectFromToSubjectAndBody() {
        dispatcher.dispatchEmail("supervisor@sentinelx.local", "URGENT: SLA BREACHED", "Incident exceeded deadline");

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());

        SimpleMailMessage sent = captor.getValue();
        assertEquals("alerts@sentinelx.local", sent.getFrom());
        assertArrayEquals(new String[]{"supervisor@sentinelx.local"}, sent.getTo());
        assertEquals("URGENT: SLA BREACHED", sent.getSubject());
        assertEquals("Incident exceeded deadline", sent.getText());
    }

    @Test
    void dispatchEmail_propagatesSendFailureInsteadOfSwallowingIt() {
        // The Kafka consumer's retry/DLQ handling only works if this method
        // lets a send failure surface as an exception (see
        // NotificationDispatcher's class-level doc).
        doThrow(new MailSendException("Mailhog unreachable")).when(mailSender).send(any(SimpleMailMessage.class));

        assertThrows(MailSendException.class, () ->
                dispatcher.dispatchEmail("supervisor@sentinelx.local", "subject", "body"));
    }
}
