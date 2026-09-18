package com.taskmanager.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.taskmanager.common.exception.InvalidRefreshTokenException;
import com.taskmanager.user.User;
import com.taskmanager.user.UserRepository;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class RefreshTokenServiceTest {

    @Autowired private RefreshTokenService service;
    @Autowired private RefreshTokenRepository repository;
    @Autowired private UserRepository userRepository;

    private User user;

    @BeforeEach
    void setUp() {
        user = userRepository.save(User.builder()
                .email("refresh-" + System.nanoTime() + "@example.com")
                .password("hashed")
                .build());
    }

    @Test
    void rawTokenIsNeverStored() {
        String raw = service.issue(user).rawToken();
        assertTrue(repository.findAll().stream().noneMatch(t -> raw.equals(t.getTokenHash())),
                "the raw token must not appear in the table");
        assertEquals(64, repository.findAll().get(0).getTokenHash().length(), "sha-256 hex");
    }

    @Test
    void rotationIssuesANewTokenAndRetiresTheOld() {
        String first = service.issue(user).rawToken();
        String second = service.rotate(first).token().rawToken();

        assertNotEquals(first, second);
        // the old token no longer works
        assertThrows(InvalidRefreshTokenException.class, () -> service.rotate(first));
    }

    @Test
    void replayOfAUsedTokenRevokesTheWholeFamily() {
        String first = service.issue(user).rawToken();
        String second = service.rotate(first).token().rawToken();

        // an attacker replays the already-consumed token
        assertThrows(InvalidRefreshTokenException.class, () -> service.rotate(first));

        // the legitimate holder's current token is now dead too
        assertThrows(InvalidRefreshTokenException.class, () -> service.rotate(second));
    }

    @Test
    void rotationKeepsTheSameFamily() {
        String first = service.issue(user).rawToken();
        service.rotate(first);
        assertEquals(1, repository.findAll().stream()
                .filter(t -> t.getUser().getId().equals(user.getId()))
                .map(RefreshToken::getFamilyId).distinct().count());
    }

    @Test
    void unknownTokenIsRejected() {
        assertThrows(InvalidRefreshTokenException.class, () -> service.rotate("not-a-real-token"));
    }

    @Test
    void revokedTokenIsRejected() {
        String raw = service.issue(user).rawToken();
        service.revokeFamilyOf(raw);
        assertThrows(InvalidRefreshTokenException.class, () -> service.rotate(raw));
    }

    @Test
    void expiredTokenIsRejected() {
        String raw = service.issue(user).rawToken();
        RefreshToken stored = repository.findAll().stream()
                .filter(t -> t.getUser().getId().equals(user.getId())).findFirst().orElseThrow();
        stored.setExpiresAt(LocalDateTime.now(ZoneOffset.UTC).minusMinutes(1));
        repository.save(stored);
        assertThrows(InvalidRefreshTokenException.class, () -> service.rotate(raw));
    }

    @Test
    void expiredTokensArePurged() {
        String raw = service.issue(user).rawToken();
        RefreshToken stored = repository.findByTokenHash(
                repository.findAll().get(0).getTokenHash()).orElseThrow();
        stored.setExpiresAt(LocalDateTime.now(ZoneOffset.UTC).minusDays(1));
        repository.save(stored);
        assertTrue(service.deleteExpired(LocalDateTime.now(ZoneOffset.UTC)) >= 1);
    }
}
