package com.sentinelx.notification.config;

import org.apache.kafka.common.TopicPartition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.util.backoff.ExponentialBackOff;

/**
 * Kafka Error Handling & Dead-Letter Queue (DLQ) Configuration (Section 7 & 8).
 * Configures exponential retry backoff (1s initial, multiplier 2.0, max 3 attempts).
 * When all retries are exhausted, the DeadLetterPublishingRecoverer forwards the failed
 * message to {original_topic}.DLQ without losing data or stalling consumer group offsets.
 */
@Configuration
public class KafkaConsumerConfig {

    private static final Logger log = LoggerFactory.getLogger(KafkaConsumerConfig.class);

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, String> kafkaListenerContainerFactory(
            ConsumerFactory<String, String> consumerFactory,
            KafkaTemplate<String, String> kafkaTemplate) {

        ConcurrentKafkaListenerContainerFactory<String, String> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory);

        // Dead-Letter Publishing Recoverer routes to "<topic>.DLQ"
        DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(kafkaTemplate,
                (record, ex) -> {
                    log.error("Retries exhausted for topic={} offset={}. Routing to DLQ. Reason: {}",
                            record.topic(), record.offset(), ex.getMessage());
                    return new TopicPartition(record.topic() + ".DLQ", record.partition());
                });

        // Exponential backoff: 1000ms -> 2000ms -> 4000ms (max 3 retries)
        ExponentialBackOff backOff = new ExponentialBackOff(1000L, 2.0);
        backOff.setMaxElapsedTime(10000L);

        DefaultErrorHandler errorHandler = new DefaultErrorHandler(recoverer, backOff);
        factory.setCommonErrorHandler(errorHandler);

        return factory;
    }
}
