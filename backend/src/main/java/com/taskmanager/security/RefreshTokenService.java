package com.taskmanager.security;

import com.taskmanager.common.exception.InvalidRefreshTokenException;
import com.taskmanager.user.User;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private static final Logger log = LoggerFactory.getLogger(RefreshTokenService.class);
    private static final int TOKEN_BYTES = 32;

    private final RefreshTokenRepository refreshTokenRepository;
    private final RefreshTokenRevoker refreshTokenRevoker;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${jwt.refresh-days}")
    private long refreshDays;

    public record IssuedToken(String rawToken, LocalDateTime expiresAt) {
    }

    @Transactional
    public IssuedToken issue(User user) {
        return persist(user, UUID.randomUUID().toString());
    }

    /**
     * Consumes a refresh token and issues its replacement. A token that was already used is
     * treated as stolen: the whole rotation family is revoked rather than just this token.
     */
    @Transactional
    public RotationResult rotate(String rawToken) {
        LocalDateTime now = now();
        RefreshToken stored = refreshTokenRepository.findByTokenHash(hash(rawToken))
                .orElseThrow(() -> new InvalidRefreshTokenException("unknown refresh token"));

        if (stored.getUsedAt() != null) {
            // replay: the legitimate holder already rotated this token, so someone copied it.
            // revoke in its own transaction — the exception below would roll back this update
            refreshTokenRevoker.revokeFamily(stored.getFamilyId(), now);
            log.warn("refresh token replay detected, family {} revoked", stored.getFamilyId());
            throw new InvalidRefreshTokenException("refresh token already used");
        }
        if (stored.getRevokedAt() != null) {
            throw new InvalidRefreshTokenException("refresh token revoked");
        }
        if (!stored.getExpiresAt().isAfter(now)) {
            throw new InvalidRefreshTokenException("refresh token expired");
        }

        stored.setUsedAt(now);
        refreshTokenRepository.save(stored);

        User user = stored.getUser();
        return new RotationResult(user, persist(user, stored.getFamilyId()));
    }

    @Transactional
    public void revokeFamilyOf(String rawToken) {
        refreshTokenRepository.findByTokenHash(hash(rawToken))
                .ifPresent(token -> refreshTokenRevoker.revokeFamily(token.getFamilyId(), now()));
    }

    @Transactional
    public int deleteExpired(LocalDateTime cutoff) {
        return refreshTokenRepository.deleteExpired(cutoff);
    }

    public record RotationResult(User user, IssuedToken token) {
    }

    private IssuedToken persist(User user, String familyId) {
        byte[] bytes = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        LocalDateTime expiresAt = now().plusDays(refreshDays);

        refreshTokenRepository.save(RefreshToken.builder()
                .tokenHash(hash(rawToken))
                .familyId(familyId)
                .user(user)
                .expiresAt(expiresAt)
                .build());

        return new IssuedToken(rawToken, expiresAt);
    }

    private String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(rawToken.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }

    private LocalDateTime now() {
        return LocalDateTime.now(ZoneOffset.UTC);
    }
}
