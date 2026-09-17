package com.taskmanager.report.dto;

import java.time.Instant;

public record TrendPoint(Instant bucket, long count) {
}
