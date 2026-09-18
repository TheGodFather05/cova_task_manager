package com.taskmanager.security;

import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class RefreshTokenRevoker {

    private final RefreshTokenRepository refreshTokenRepository;

    // REQUIRES_NEW so a revocation survives the exception the caller throws afterwards
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public int revokeFamily(String familyId, LocalDateTime now) {
        return refreshTokenRepository.revokeFamily(familyId, now);
    }
}
