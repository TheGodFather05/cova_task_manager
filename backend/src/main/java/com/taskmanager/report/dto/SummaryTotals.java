package com.taskmanager.report.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.ALWAYS)
public record SummaryTotals(long tasksCreated, long tasksCompleted, Double completionRate) {
}
