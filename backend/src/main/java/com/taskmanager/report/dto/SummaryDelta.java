package com.taskmanager.report.dto;

// rate deltas are expressed in percentage points, never as a percent change:
// "up 25%" is ambiguous between 60->75 and 60->85, "up 15 points" is not
public record SummaryDelta(
        long tasksCreated,
        Double tasksCreatedPercent,
        long tasksCompleted,
        Double tasksCompletedPercent,
        Double completionRatePoints) {
}
