package com.sentinelx.search.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sentinelx.common.events.IncidentCreatedEventV1;
import com.sentinelx.search.model.IncidentDocument;
import com.sentinelx.search.service.SearchIndexService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class SearchEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(SearchEventConsumer.class);

    private final SearchIndexService searchIndexService;
    private final ObjectMapper objectMapper;

    public SearchEventConsumer(SearchIndexService searchIndexService, ObjectMapper objectMapper) {
        this.searchIndexService = searchIndexService;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "incident.created", groupId = "search-service-group")
    public void onIncidentCreated(String message) {
        try {
            IncidentCreatedEventV1 event = objectMapper.readValue(message, IncidentCreatedEventV1.class);
            var payload = event.getPayload();

            IncidentDocument.GeoLocation geo = null;
            String building = null;
            String floor = null;
            String zoneId = null;
            String address = null;

            if (payload.location() != null) {
                geo = new IncidentDocument.GeoLocation(payload.location().latitude(), payload.location().longitude());
                building = payload.location().building();
                floor = payload.location().floor();
                zoneId = payload.location().zoneId();
                address = payload.location().address();
            }

            IncidentDocument doc = new IncidentDocument(
                    payload.incidentId(),
                    payload.reporterId(),
                    payload.title(),
                    payload.description(),
                    payload.category().name(),
                    payload.severity().name(),
                    payload.status().name(),
                    null,
                    geo,
                    building,
                    floor,
                    zoneId,
                    address,
                    event.getTimestamp() != null ? event.getTimestamp() : Instant.now()
            );

            searchIndexService.indexIncident(doc);

        } catch (Exception e) {
            log.error("Error consuming incident.created for search indexing: {}", e.getMessage(), e);
        }
    }
}
