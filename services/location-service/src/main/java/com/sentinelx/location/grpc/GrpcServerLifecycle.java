package com.sentinelx.location.grpc;

import io.grpc.Server;
import io.grpc.ServerBuilder;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class GrpcServerLifecycle {

    private static final Logger log = LoggerFactory.getLogger(GrpcServerLifecycle.class);

    private final LocationGrpcService locationGrpcService;
    private final int port;
    private Server server;

    public GrpcServerLifecycle(
            LocationGrpcService locationGrpcService,
            @Value("${grpc.server.port:9094}") int port) {
        this.locationGrpcService = locationGrpcService;
        this.port = port;
    }

    @PostConstruct
    public void start() throws IOException {
        server = ServerBuilder.forPort(port)
                .addService(locationGrpcService)
                .build()
                .start();
        log.info("gRPC Location Server started successfully on port {}", port);
    }

    @PreDestroy
    public void stop() {
        if (server != null) {
            log.info("Shutting down gRPC Location Server on port {}", port);
            server.shutdown();
        }
    }
}
