package com.taskmanager.report.dto;

import java.time.LocalDate;

public record HeatmapDay(LocalDate date, long count) {
}
