package com.taskmanager.report;

import com.taskmanager.report.dto.HeatmapResponse;
import com.taskmanager.report.dto.QuadrantCountResponse;
import com.taskmanager.report.dto.SummaryResponse;
import com.taskmanager.report.dto.TrendResponse;
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
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/summary")
    public SummaryResponse summary(@RequestParam Period period,
                                   @RequestParam(required = false) String zone) {
        return reportService.summary(period, zone);
    }

    @GetMapping("/trend")
    public TrendResponse trend(@RequestParam Period period,
                               @RequestParam(required = false) String zone) {
        return reportService.trend(period, zone);
    }

    @GetMapping("/quadrants")
    public QuadrantCountResponse quadrants(@RequestParam Period period,
                                           @RequestParam(required = false) String zone) {
        return reportService.quadrants(period, zone);
    }

    @GetMapping("/distribution")
    public QuadrantCountResponse distribution() {
        return reportService.distribution();
    }

    @GetMapping("/heatmap")
    public HeatmapResponse heatmap(@RequestParam(required = false) Integer year,
                                   @RequestParam(required = false) String zone) {
        return reportService.heatmap(year, zone);
    }
}
