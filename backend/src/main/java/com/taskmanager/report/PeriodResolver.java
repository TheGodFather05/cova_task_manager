package com.taskmanager.report;

import com.taskmanager.common.exception.InvalidReportParameterException;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class PeriodResolver {

    static final int MIN_YEAR = 2000;

    public ResolvedPeriod resolve(Period period, ZoneId zone, Instant now) {
        ZonedDateTime reference = now.atZone(zone);
        ZonedDateTime start = switch (period) {
            case DAILY -> reference.toLocalDate().atStartOfDay(zone);
            // week start is pinned to Monday, not WeekFields.of(locale): the request's locale
            // must not change what a weekly report means
            case WEEKLY -> reference.toLocalDate()
                    .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                    .atStartOfDay(zone);
            case MONTHLY -> reference.toLocalDate().withDayOfMonth(1).atStartOfDay(zone);
            case YEARLY -> reference.toLocalDate().withDayOfYear(1).atStartOfDay(zone);
        };
        return build(period, zone, start, advance(start, period));
    }

    public ResolvedPeriod previous(ResolvedPeriod current) {
        ZonedDateTime start = retreat(current.startZoned(), current.period());
        return build(current.period(), current.zone(), start, current.startZoned());
    }

    public ResolvedPeriod resolveYear(int year, ZoneId zone, Instant now) {
        int currentYear = now.atZone(zone).getYear();
        if (year < MIN_YEAR || year > currentYear + 1) {
            throw new InvalidReportParameterException(
                    "year must be between " + MIN_YEAR + " and " + (currentYear + 1));
        }
        ZonedDateTime start = LocalDate.of(year, 1, 1).atStartOfDay(zone);
        return build(Period.YEARLY, zone, start, start.plusYears(1));
    }

    public ZoneId parseZone(String zone) {
        if (zone == null || zone.isBlank()) {
            return ZoneOffset.UTC;
        }
        try {
            return ZoneId.of(zone.trim());
        } catch (Exception e) {
            throw new InvalidReportParameterException("invalid zone: " + zone);
        }
    }

    private ZonedDateTime advance(ZonedDateTime start, Period period) {
        return switch (period) {
            case DAILY -> start.plusDays(1);
            case WEEKLY -> start.plusWeeks(1);
            case MONTHLY -> start.plusMonths(1);
            case YEARLY -> start.plusYears(1);
        };
    }

    private ZonedDateTime retreat(ZonedDateTime start, Period period) {
        return switch (period) {
            case DAILY -> start.minusDays(1);
            case WEEKLY -> start.minusWeeks(1);
            case MONTHLY -> start.minusMonths(1);
            case YEARLY -> start.minusYears(1);
        };
    }

    private ResolvedPeriod build(Period period, ZoneId zone,
                                 ZonedDateTime start, ZonedDateTime end) {
        return new ResolvedPeriod(period, zone, start, end,
                toUtc(start), toUtc(end), period.bucketUnit(),
                bucketStarts(start, end, period.bucketUnit()));
    }

    // completedAt holds UTC wall-clock time, so a zoned bound becomes a query bound here
    private LocalDateTime toUtc(ZonedDateTime zoned) {
        return LocalDateTime.ofInstant(zoned.toInstant(), ZoneOffset.UTC);
    }

    // iterate instants rather than counting: a DST day has 23 or 25 hours, not 24
    private List<ZonedDateTime> bucketStarts(ZonedDateTime start, ZonedDateTime end,
                                             ChronoUnit unit) {
        List<ZonedDateTime> buckets = new ArrayList<>();
        for (ZonedDateTime bucket = start; bucket.isBefore(end); bucket = bucket.plus(1, unit)) {
            buckets.add(bucket);
        }
        return List.copyOf(buckets);
    }
}
