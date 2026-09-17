package com.taskmanager.report.dto;

import java.time.Instant;

public record SummaryResponse(
        String period,
        String zone,
        Instant start,
        Instant end,
        boolean currentPeriodComplete,
        SummaryTotals current,
        SummaryTotals previous,
        SummaryDelta delta) {
}
