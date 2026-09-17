package com.taskmanager.report.dto;

import java.time.Instant;
import java.util.List;

public record TrendResponse(
        String period,
        String zone,
        String bucketUnit,
        Instant start,
        Instant end,
        List<TrendPoint> points) {
}
