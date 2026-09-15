package com.sentinelx.search.config;

import org.apache.hc.core5.http.HttpHost;
import org.opensearch.client.json.jackson.JacksonJsonpMapper;
import org.opensearch.client.opensearch.OpenSearchClient;
import org.opensearch.client.transport.OpenSearchTransport;
import org.opensearch.client.transport.httpclient5.ApacheHttpClient5TransportBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Wires a real OpenSearch REST client (Section 10). PostgreSQL remains the
 * system of record for incidents; this client only ever backs the search
 * index, which is rebuilt from Kafka events and is allowed to be briefly
 * stale or unavailable (Section 23 graceful degradation).
 */
@Configuration
public class OpenSearchConfig {

    @Bean
    public OpenSearchClient openSearchClient(
            @Value("${opensearch.host:localhost}") String host,
            @Value("${opensearch.port:9200}") int port,
            @Value("${opensearch.scheme:http}") String scheme) {

        HttpHost httpHost = new HttpHost(scheme, host, port);
        OpenSearchTransport transport = ApacheHttpClient5TransportBuilder.builder(httpHost)
                .setMapper(new JacksonJsonpMapper())
                .build();
        return new OpenSearchClient(transport);
    }
}
