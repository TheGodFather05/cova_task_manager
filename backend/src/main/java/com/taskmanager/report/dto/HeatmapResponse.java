package com.taskmanager.report.dto;

import java.util.List;

public record HeatmapResponse(
        int year,
        String zone,
        long maxCount,
        long totalCompleted,
        List<HeatmapDay> days) {
}
