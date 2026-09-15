package com.sentinelx.incident.outbox;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.CompletableFuture;

/**
 * Transactional Outbox Event Publisher.
 * Solves the Dual-Write Problem:
 * Instead of writing to PostgreSQL and publishing to Kafka in the same application method
 * (which risks one failing after the other succeeds), the event is committed to outbox_events
 * in the exact same database transaction as the domain aggregate.
 *
 * This publisher asynchronously reads pending events in creation order, transmits them to Kafka
 * partitioned by aggregate_id (incidentId) to guarantee ordering, and updates the outbox status.
 */
@Component
@EnableScheduling
public class OutboxPublisher {

    private static final Logger log = LoggerFactory.getLogger(OutboxPublisher.class);

    private final OutboxEventRepository outboxEventRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final int batchSize;
    private final int maxRetries;

    public OutboxPublisher(
            OutboxEventRepository outboxEventRepository,
            KafkaTemplate<String, String> kafkaTemplate,
            @Value("${outbox.publisher.batch-size:50}") int batchSize,
            @Value("${outbox.publisher.max-retries:5}") int maxRetries) {
        this.outboxEventRepository = outboxEventRepository;
        this.kafkaTemplate = kafkaTemplate;
        this.batchSize = batchSize;
        this.maxRetries = maxRetries;
    }

    @Scheduled(fixedDelayString = "${outbox.publisher.fixed-delay-ms:1000}")
    @Transactional
    public void publishPendingEvents() {
        List<OutboxEventEntity> pendingEvents = outboxEventRepository.findPendingEvents(
                maxRetries,
                PageRequest.of(0, batchSize)
        );

        if (pendingEvents.isEmpty()) {
            return;
        }

        log.debug("Found {} pending outbox events for publishing", pendingEvents.size());

        for (OutboxEventEntity event : pendingEvents) {
            try {
                // Topic name corresponds to the event_type (e.g. incident.created, incident.resolved)
                String topic = event.getEventType();
                // Partition key: aggregate_id (incidentId) guarantees total in-order delivery per incident
                String key = event.getAggregateId();
                String payload = event.getPayload();

                CompletableFuture<SendResult<String, String>> future = kafkaTemplate.send(topic, key, payload);

                future.whenComplete((result, ex) -> {
                    if (ex == null) {
                        event.setStatus(OutboxStatus.PUBLISHED);
                        event.setPublishedAt(Instant.now());
                        outboxEventRepository.save(event);
                        log.info("Published outbox event id={} type={} partition={} offset={}",
                                event.getId(), topic,
                                result.getRecordMetadata().partition(),
                                result.getRecordMetadata().offset());
                    } else {
                        handlePublishFailure(event, ex);
                    }
                });

            } catch (Exception ex) {
                handlePublishFailure(event, ex);
            }
        }
    }

    private void handlePublishFailure(OutboxEventEntity event, Throwable ex) {
        event.setRetryCount(event.getRetryCount() + 1);
        if (event.getRetryCount() >= maxRetries) {
            event.setStatus(OutboxStatus.FAILED);
            log.error("Outbox event id={} marked FAILED after reaching maximum retries: {}",
                    event.getId(), ex.getMessage());
        } else {
            log.warn("Failed to publish outbox event id={}, retry={}/{}: {}",
                    event.getId(), event.getRetryCount(), maxRetries, ex.getMessage());
        }
        outboxEventRepository.save(event);
    }
}
