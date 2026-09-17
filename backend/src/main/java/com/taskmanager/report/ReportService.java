package com.taskmanager.report;

import com.taskmanager.report.dto.HeatmapDay;
import com.taskmanager.report.dto.HeatmapResponse;
import com.taskmanager.report.dto.QuadrantCount;
import com.taskmanager.report.dto.QuadrantCountResponse;
import com.taskmanager.report.dto.SummaryDelta;
import com.taskmanager.report.dto.SummaryResponse;
import com.taskmanager.report.dto.SummaryTotals;
import com.taskmanager.report.dto.TrendPoint;
import com.taskmanager.report.dto.TrendResponse;
import com.taskmanager.report.projection.BucketAggregate;
import com.taskmanager.report.projection.QuadrantAggregate;
import com.taskmanager.security.CurrentUserService;
import com.taskmanager.task.Quadrant;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final PeriodResolver periodResolver;
    private final CurrentUserService currentUserService;

    @Transactional(readOnly = true)
    public SummaryResponse summary(Period period, String zoneParam) {
        Long userId = currentUserService.requireId();
        ZoneId zone = periodResolver.parseZone(zoneParam);
        Instant now = Instant.now();
        ResolvedPeriod current = periodResolver.resolve(period, zone, now);
        ResolvedPeriod previous = periodResolver.previous(current);

        SummaryTotals currentTotals = totals(userId, current);
        SummaryTotals previousTotals = totals(userId, previous);

        return new SummaryResponse(
                period.name(),
                zone.getId(),
                current.startZoned().toInstant(),
                current.endZoned().toInstant(),
                !current.endZoned().toInstant().isAfter(now),
                currentTotals,
                previousTotals,
                delta(currentTotals, previousTotals));
    }

    @Transactional(readOnly = true)
    public TrendResponse trend(Period period, String zoneParam) {
        Long userId = currentUserService.requireId();
        ZoneId zone = periodResolver.parseZone(zoneParam);
        ResolvedPeriod resolved = periodResolver.resolve(period, zone, Instant.now());

        Map<ZonedDateTime, Long> counts = foldToBuckets(userId, resolved);
        List<TrendPoint> points = new ArrayList<>(resolved.bucketCount());
        for (ZonedDateTime bucket : resolved.bucketStarts()) {
            // empty intervals are returned as zero, never omitted
            points.add(new TrendPoint(bucket.toInstant(), counts.getOrDefault(bucket, 0L)));
        }

        return new TrendResponse(period.name(), zone.getId(), resolved.bucketUnit().name(),
                resolved.startZoned().toInstant(), resolved.endZoned().toInstant(), points);
    }

    @Transactional(readOnly = true)
    public QuadrantCountResponse quadrants(Period period, String zoneParam) {
        Long userId = currentUserService.requireId();
        ZoneId zone = periodResolver.parseZone(zoneParam);
        ResolvedPeriod resolved = periodResolver.resolve(period, zone, Instant.now());

        Map<Quadrant, Long> counts = toQuadrantMap(reportRepository
                .aggregateCompletedByQuadrant(userId, resolved.startUtc(), resolved.endUtc()));

        return new QuadrantCountResponse(period.name(), zone.getId(),
                resolved.startZoned().toInstant(), resolved.endZoned().toInstant(), null,
                total(counts), toQuadrantCounts(counts));
    }

    @Transactional(readOnly = true)
    public QuadrantCountResponse distribution() {
        Long userId = currentUserService.requireId();
        Map<Quadrant, Long> counts =
                toQuadrantMap(reportRepository.aggregateOpenByQuadrant(userId));
        return new QuadrantCountResponse(null, null, null, null, Instant.now(),
                total(counts), toQuadrantCounts(counts));
    }

    @Transactional(readOnly = true)
    public HeatmapResponse heatmap(Integer year, String zoneParam) {
        Long userId = currentUserService.requireId();
        ZoneId zone = periodResolver.parseZone(zoneParam);
        Instant now = Instant.now();
        int resolvedYear = year != null ? year : now.atZone(zone).getYear();
        ResolvedPeriod resolved = periodResolver.resolveYear(resolvedYear, zone, now);

        Map<LocalDate, Long> byDate = new LinkedHashMap<>();
        for (BucketAggregate row : reportRepository
                .aggregateCompletedByHour(userId, resolved.startUtc(), resolved.endUtc())) {
            LocalDate date = toZone(row, zone).toLocalDate();
            byDate.merge(date, row.getCount(), Long::sum);
        }

        List<HeatmapDay> days = new ArrayList<>(366);
        long max = 0;
        long total = 0;
        LocalDate end = resolved.endZoned().toLocalDate();
        for (LocalDate date = resolved.startZoned().toLocalDate(); date.isBefore(end);
                date = date.plusDays(1)) {
            long count = byDate.getOrDefault(date, 0L);
            days.add(new HeatmapDay(date, count));
            max = Math.max(max, count);
            total += count;
        }

        return new HeatmapResponse(resolvedYear, zone.getId(), max, total, days);
    }

    private SummaryTotals totals(Long userId, ResolvedPeriod period) {
        long created = reportRepository.countCreated(userId, period.startUtc(), period.endUtc());
        long completed =
                reportRepository.countCompleted(userId, period.startUtc(), period.endUtc());
        return new SummaryTotals(created, completed, rate(completed, created));
    }

    private SummaryDelta delta(SummaryTotals current, SummaryTotals previous) {
        return new SummaryDelta(
                current.tasksCreated() - previous.tasksCreated(),
                percentChange(current.tasksCreated(), previous.tasksCreated()),
                current.tasksCompleted() - previous.tasksCompleted(),
                percentChange(current.tasksCompleted(), previous.tasksCompleted()),
                points(current.completionRate(), previous.completionRate()));
    }

    // undefined rather than zero: a zero denominator is not "no change"
    private Double rate(long completed, long created) {
        return created == 0 ? null : round(100.0 * completed / created);
    }

    private Double percentChange(long current, long previous) {
        return previous == 0 ? null : round(100.0 * (current - previous) / previous);
    }

    private Double points(Double current, Double previous) {
        return current == null || previous == null ? null : round(current - previous);
    }

    private double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private Map<ZonedDateTime, Long> foldToBuckets(Long userId, ResolvedPeriod resolved) {
        Map<ZonedDateTime, Long> counts = new LinkedHashMap<>();
        for (BucketAggregate row : reportRepository
                .aggregateCompletedByHour(userId, resolved.startUtc(), resolved.endUtc())) {
            ZonedDateTime bucket = truncate(toZone(row, resolved.zone()), resolved.bucketUnit());
            counts.merge(bucket, row.getCount(), Long::sum);
        }
        return counts;
    }

    // rows come back as UTC components; bucketing must happen in the user's zone or the
    // first and last buckets of a zoned period are wrong
    private ZonedDateTime toZone(BucketAggregate row, ZoneId zone) {
        return LocalDateTime.of(row.getY(), row.getM(), row.getD(), row.getH(), 0)
                .atZone(ZoneOffset.UTC)
                .withZoneSameInstant(zone);
    }

    private ZonedDateTime truncate(ZonedDateTime moment, ChronoUnit unit) {
        return switch (unit) {
            case HOURS -> moment.truncatedTo(ChronoUnit.HOURS);
            case DAYS -> moment.toLocalDate().atStartOfDay(moment.getZone());
            case MONTHS -> moment.toLocalDate().withDayOfMonth(1).atStartOfDay(moment.getZone());
            default -> moment;
        };
    }

    // the enum drives iteration, so quadrants with no rows appear as zero in a stable order
    private Map<Quadrant, Long> toQuadrantMap(List<QuadrantAggregate> rows) {
        Map<Quadrant, Long> counts = new EnumMap<>(Quadrant.class);
        for (Quadrant quadrant : Quadrant.values()) {
            counts.put(quadrant, 0L);
        }
        for (QuadrantAggregate row : rows) {
            counts.merge(Quadrant.of(row.getImportance(), row.getUrgency()),
                    row.getCount(), Long::sum);
        }
        return counts;
    }

    private long total(Map<Quadrant, Long> counts) {
        return counts.values().stream().mapToLong(Long::longValue).sum();
    }

    private List<QuadrantCount> toQuadrantCounts(Map<Quadrant, Long> counts) {
        long total = total(counts);
        List<QuadrantCount> result = new ArrayList<>(Quadrant.values().length);
        for (Quadrant quadrant : Quadrant.values()) {
            long count = counts.get(quadrant);
            result.add(new QuadrantCount(quadrant, count,
                    total == 0 ? 0.0 : round(100.0 * count / total)));
        }
        return result;
    }
}
