package com.sentinelx.assignment;

import com.sentinelx.assignment.service.DistributedLockService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Real concurrency proof for the Redis distributed lock (Section 9/30):
 * a genuine Redis container via Testcontainers, with genuinely concurrent
 * threads racing for the exact same responder lock key. A mock (as the
 * existing AssignmentScoringAndLockTest uses) can only assert "given this
 * stubbed return value, the code branches correctly" -- it cannot prove
 * SETNX is actually atomic under real contention. This test can.
 */
@Testcontainers
class DistributedLockRedisIntegrationTest {

    @Container
    static final GenericContainer<?> REDIS = new GenericContainer<>(DockerImageName.parse("redis:7.2-alpine"))
            .withExposedPorts(6379);

    private LettuceConnectionFactory connectionFactory;

    private DistributedLockService newLockService() {
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration(REDIS.getHost(), REDIS.getMappedPort(6379));
        connectionFactory = new LettuceConnectionFactory(config);
        connectionFactory.afterPropertiesSet();
        StringRedisTemplate template = new StringRedisTemplate(connectionFactory);
        template.afterPropertiesSet();
        return new DistributedLockService(template, 10);
    }

    @AfterEach
    void tearDown() {
        if (connectionFactory != null) {
            connectionFactory.destroy();
        }
    }

    @Test
    void exactlyOneOfManyConcurrentThreadsAcquiresTheSameResponderLock() throws InterruptedException, ExecutionException {
        DistributedLockService lockService = newLockService();
        String responderId = "resp-concurrency-test";
        int contenderCount = 20;

        ExecutorService pool = Executors.newFixedThreadPool(contenderCount);
        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(contenderCount);
        AtomicInteger winners = new AtomicInteger(0);
        List<Future<?>> futures = new CopyOnWriteArrayList<>();

        for (int i = 0; i < contenderCount; i++) {
            String incidentId = "inc-concurrent-" + i;
            futures.add(pool.submit(() -> {
                try {
                    startGate.await(); // release all threads at once to maximize real contention
                    if (lockService.tryAcquire(responderId, incidentId)) {
                        winners.incrementAndGet();
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    doneLatch.countDown();
                }
            }));
        }

        startGate.countDown();
        assertTrue(doneLatch.await(15, TimeUnit.SECONDS), "all contenders must finish within timeout");
        pool.shutdown();

        for (Future<?> f : futures) {
            f.get(); // surface any thread exceptions
        }

        assertEquals(1, winners.get(),
                "exactly one of " + contenderCount + " genuinely concurrent threads must win the real Redis SETNX lock");
    }

    @Test
    void lockReleaseByNonOwnerIsRejectedAgainstRealRedis() {
        DistributedLockService lockService = newLockService();
        String responderId = "resp-release-test";

        assertTrue(lockService.tryAcquire(responderId, "inc-owner"), "owner must acquire the real lock");
        // A different incident releasing must not remove the real owner's lock
        lockService.release(responderId, "inc-not-the-owner");

        assertEquals(false, lockService.tryAcquire(responderId, "inc-second-claimant"),
                "lock must still be held by the original owner in real Redis after a non-owner release attempt");
    }
}
