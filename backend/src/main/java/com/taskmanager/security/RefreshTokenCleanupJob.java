package com.taskmanager.security;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RefreshTokenCleanupJob {

    private static final Logger log = LoggerFactory.getLogger(RefreshTokenCleanupJob.class);

    private final RefreshTokenService refreshTokenService;

    @Scheduled(cron = "0 0 3 * * *", zone = "UTC")
    public void purgeExpired() {
        int deleted = refreshTokenService.deleteExpired(LocalDateTime.now(ZoneOffset.UTC));
        if (deleted > 0) {
            log.info("purged {} expired refresh tokens", deleted);
        }
    }
}
