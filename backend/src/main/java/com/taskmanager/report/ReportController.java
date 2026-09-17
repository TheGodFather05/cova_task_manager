package com.taskmanager.report;

import com.taskmanager.common.ApiError;
import com.taskmanager.report.dto.HeatmapResponse;
import com.taskmanager.report.dto.QuadrantCountResponse;
import com.taskmanager.report.dto.SummaryResponse;
import com.taskmanager.report.dto.TrendResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Validated
@Tag(name = "reports", description = "Read-only aggregates over the caller's tasks")
@ApiResponse(responseCode = "401", description = "Missing or invalid token",
        content = @Content(schema = @Schema(implementation = ApiError.class)))
@ApiResponse(responseCode = "400", description = "Unknown period, invalid zone or year",
        content = @Content(schema = @Schema(implementation = ApiError.class)))
public class ReportController {

    private static final String PERIOD_DESCRIPTION = "DAILY, WEEKLY, MONTHLY or YEARLY";
    private static final String ZONE_DESCRIPTION =
            "IANA zone used for period bounds, e.g. Africa/Douala; defaults to UTC";

    private final ReportService reportService;

    @GetMapping("/summary")
    @Operation(summary = "Counts, completion rate and variation against the previous period")
    public SummaryResponse summary(
            @Parameter(description = PERIOD_DESCRIPTION) @RequestParam Period period,
            @Parameter(description = ZONE_DESCRIPTION) @RequestParam(required = false) String zone) {
        return reportService.summary(period, zone);
    }

    @GetMapping("/trend")
    @Operation(summary = "Completed tasks over time; empty intervals are returned as zero")
    public TrendResponse trend(
            @Parameter(description = PERIOD_DESCRIPTION) @RequestParam Period period,
            @Parameter(description = ZONE_DESCRIPTION) @RequestParam(required = false) String zone) {
        return reportService.trend(period, zone);
    }

    @GetMapping("/quadrants")
    @Operation(summary = "Completed tasks by quadrant over the period")
    public QuadrantCountResponse quadrants(
            @Parameter(description = PERIOD_DESCRIPTION) @RequestParam Period period,
            @Parameter(description = ZONE_DESCRIPTION) @RequestParam(required = false) String zone) {
        return reportService.quadrants(period, zone);
    }

    @GetMapping("/distribution")
    @Operation(summary = "Open tasks by quadrant, as of now")
    public QuadrantCountResponse distribution() {
        return reportService.distribution();
    }

    @GetMapping("/heatmap")
    @Operation(summary = "Completed tasks per day over a year, every day included")
    public HeatmapResponse heatmap(
            @Parameter(description = "Defaults to the current year in the resolved zone")
            @RequestParam(required = false) Integer year,
            @Parameter(description = ZONE_DESCRIPTION) @RequestParam(required = false) String zone) {
        return reportService.heatmap(year, zone);
    }
}
