package com.taskmanager.report;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

public record ResolvedPeriod(
        Period period,
        ZoneId zone,
        ZonedDateTime startZoned,
        ZonedDateTime endZoned,
        LocalDateTime startUtc,
        LocalDateTime endUtc,
        ChronoUnit bucketUnit,
        List<ZonedDateTime> bucketStarts) {

    public int bucketCount() {
        return bucketStarts.size();
    }
}
