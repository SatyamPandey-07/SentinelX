package com.sentinelx.audit;

import com.sentinelx.audit.entity.AuditEventEntity;
import com.sentinelx.audit.repository.AuditEventRepository;
import com.sentinelx.audit.service.AuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditHashChainingTest {

    @Mock
    private AuditEventRepository auditEventRepository;

    private AuditService auditService;

    @BeforeEach
    void setUp() {
        auditService = new AuditService(auditEventRepository);
    }

    @Test
    void testGenesisAndChainedAuditRecords() {
        // Record 1: Genesis event
        when(auditEventRepository.findTopByOrderByRecordedAtDesc()).thenReturn(Optional.empty());
        when(auditEventRepository.save(any(AuditEventEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        AuditEventEntity rec1 = auditService.recordEvent(
                "user-1", "ADMIN", "CREATE", "Incident", "inc-101", "{'title':'Fire'}", Instant.now()
        );

        assertEquals("0000000000000000000000000000000000000000000000000000000000000000", rec1.getPrevHash());
        assertNotNull(rec1.getCurrHash());
        assertEquals(64, rec1.getCurrHash().length(), "SHA-256 hash must be 64 hexadecimal characters");

        // Record 2: Chained event
        when(auditEventRepository.findTopByOrderByRecordedAtDesc()).thenReturn(Optional.of(rec1));

        AuditEventEntity rec2 = auditService.recordEvent(
                "resp-1", "RESPONDER", "ACKNOWLEDGE", "Incident", "inc-101", "{'status':'ACK'}", Instant.now()
        );

        assertEquals(rec1.getCurrHash(), rec2.getPrevHash(), "Record 2 prevHash must strictly match Record 1 currHash");
        assertNotEquals(rec1.getCurrHash(), rec2.getCurrHash());
    }
}
