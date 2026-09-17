package com.taskmanager.report.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record QuadrantCountResponse(
        String period,
        String zone,
        Instant start,
        Instant end,
        Instant asOf,
        long total,
        List<QuadrantCount> quadrants) {
}
