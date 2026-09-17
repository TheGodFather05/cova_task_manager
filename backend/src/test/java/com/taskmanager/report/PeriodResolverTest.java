package com.taskmanager.report;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.taskmanager.common.exception.InvalidReportParameterException;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class PeriodResolverTest {

    private final PeriodResolver resolver = new PeriodResolver();

    private static final ZoneId DOUALA = ZoneId.of("Africa/Douala");
    private static final ZoneId PARIS = ZoneId.of("Europe/Paris");

    @Test
    void dailyInUtcSpansTwentyFourHours() {
        ResolvedPeriod p = resolver.resolve(Period.DAILY, ZoneOffset.UTC,
                Instant.parse("2026-09-17T14:30:00Z"));
        assertEquals(LocalDateTime.parse("2026-09-17T00:00"), p.startUtc());
        assertEquals(LocalDateTime.parse("2026-09-18T00:00"), p.endUtc());
        assertEquals(24, p.bucketCount());
        assertEquals(ChronoUnit.HOURS, p.bucketUnit());
    }

    @Test
    void weeklyStartsOnMonday() {
        // 2026-09-17 is a Thursday
        ResolvedPeriod p = resolver.resolve(Period.WEEKLY, ZoneOffset.UTC,
                Instant.parse("2026-09-17T14:30:00Z"));
        assertEquals(LocalDateTime.parse("2026-09-14T00:00"), p.startUtc());
        assertEquals(7, p.bucketCount());
    }

    @ParameterizedTest
    @CsvSource({"2026-09-17T00:00:00Z,30", "2026-02-10T00:00:00Z,28", "2028-02-10T00:00:00Z,29"})
    void monthlyUsesRealMonthLength(String now, int expectedDays) {
        ResolvedPeriod p = resolver.resolve(Period.MONTHLY, ZoneOffset.UTC, Instant.parse(now));
        assertEquals(expectedDays, p.bucketCount());
    }

    @Test
    void yearlyHasTwelveMonthBuckets() {
        ResolvedPeriod p = resolver.resolve(Period.YEARLY, ZoneOffset.UTC,
                Instant.parse("2026-09-17T14:30:00Z"));
        assertEquals(12, p.bucketCount());
        assertEquals(ChronoUnit.MONTHS, p.bucketUnit());
    }

    @Test
    void dailyInPositiveOffsetZoneShiftsUtcBounds() {
        ResolvedPeriod p = resolver.resolve(Period.DAILY, DOUALA,
                Instant.parse("2026-09-17T14:30:00Z"));
        // Douala is UTC+1: local 2026-09-17T00:00 is 2026-09-16T23:00 UTC
        assertEquals(LocalDateTime.parse("2026-09-16T23:00"), p.startUtc());
        assertEquals(LocalDateTime.parse("2026-09-17T23:00"), p.endUtc());
    }

    @Test
    void lateUtcEveningIsAlreadyNextDayInPositiveOffsetZone() {
        ResolvedPeriod p = resolver.resolve(Period.DAILY, DOUALA,
                Instant.parse("2026-09-16T23:30:00Z"));
        assertEquals(17, p.startZoned().getDayOfMonth());
    }

    @ParameterizedTest
    @CsvSource({"Pacific/Kiritimati", "Pacific/Niue"})
    void extremeOffsetsStayConsistent(String zoneId) {
        ResolvedPeriod p = resolver.resolve(Period.DAILY, ZoneId.of(zoneId),
                Instant.parse("2026-09-17T12:00:00Z"));
        assertTrue(p.startUtc().isBefore(p.endUtc()));
        assertEquals(24, p.bucketCount());
        assertEquals(p.startZoned().toInstant(),
                p.startUtc().toInstant(ZoneOffset.UTC));
    }

    @Test
    void springForwardDayHasTwentyThreeBuckets() {
        ResolvedPeriod p = resolver.resolve(Period.DAILY, PARIS,
                Instant.parse("2026-03-29T10:00:00Z"));
        assertEquals(23, p.bucketCount());
        assertEquals(Duration.ofHours(23), Duration.between(p.startUtc(), p.endUtc()));
    }

    @Test
    void fallBackDayHasTwentyFiveBuckets() {
        ResolvedPeriod p = resolver.resolve(Period.DAILY, PARIS,
                Instant.parse("2026-10-25T10:00:00Z"));
        assertEquals(25, p.bucketCount());
        assertEquals(Duration.ofHours(25), Duration.between(p.startUtc(), p.endUtc()));
    }

    @Test
    void weeklyAcrossDstKeepsSevenBucketsButNot168Hours() {
        ResolvedPeriod p = resolver.resolve(Period.WEEKLY, PARIS,
                Instant.parse("2026-03-25T10:00:00Z"));
        assertEquals(7, p.bucketCount());
        assertEquals(Duration.ofHours(167), Duration.between(p.startUtc(), p.endUtc()));
    }

    @Test
    void previousPeriodEndsWhereCurrentStarts() {
        ResolvedPeriod current = resolver.resolve(Period.DAILY, ZoneOffset.UTC,
                Instant.parse("2026-09-17T14:30:00Z"));
        ResolvedPeriod previous = resolver.previous(current);
        assertEquals(current.startUtc(), previous.endUtc());
        assertEquals(LocalDateTime.parse("2026-09-16T00:00"), previous.startUtc());
    }

    @Test
    void previousOfMarchIsFebruaryWithItsRealLength() {
        ResolvedPeriod march = resolver.resolve(Period.MONTHLY, ZoneOffset.UTC,
                Instant.parse("2026-03-15T00:00:00Z"));
        ResolvedPeriod february = resolver.previous(march);
        assertEquals(LocalDateTime.parse("2026-02-01T00:00"), february.startUtc());
        assertEquals(28, february.bucketCount());
    }

    @Test
    void previousOfJanuaryIsDecemberOfPriorYear() {
        ResolvedPeriod january = resolver.resolve(Period.MONTHLY, ZoneOffset.UTC,
                Instant.parse("2026-01-10T00:00:00Z"));
        ResolvedPeriod december = resolver.previous(january);
        assertEquals(LocalDateTime.parse("2025-12-01T00:00"), december.startUtc());
        assertEquals(31, december.bucketCount());
    }

    @Test
    void leapYearHas366Days() {
        ResolvedPeriod p = resolver.resolveYear(2028, ZoneOffset.UTC,
                Instant.parse("2028-06-01T00:00:00Z"));
        assertEquals(366, ChronoUnit.DAYS.between(p.startZoned(), p.endZoned()));
    }

    @Test
    void resolveYearInPositiveOffsetZoneStartsPreviousYearInUtc() {
        ResolvedPeriod p = resolver.resolveYear(2026, DOUALA,
                Instant.parse("2026-06-01T00:00:00Z"));
        assertEquals(LocalDateTime.parse("2025-12-31T23:00"), p.startUtc());
    }

    @ParameterizedTest
    @CsvSource({"1999", "20260"})
    void outOfRangeYearIsRejected(int year) {
        assertThrows(InvalidReportParameterException.class,
                () -> resolver.resolveYear(year, ZoneOffset.UTC,
                        Instant.parse("2026-09-17T00:00:00Z")));
    }

    @Test
    void blankZoneDefaultsToUtc() {
        assertEquals(ZoneOffset.UTC, resolver.parseZone(null));
        assertEquals(ZoneOffset.UTC, resolver.parseZone("  "));
        assertEquals(DOUALA, resolver.parseZone("Africa/Douala"));
    }

    @Test
    void invalidZoneIsRejected() {
        assertThrows(InvalidReportParameterException.class, () -> resolver.parseZone("Not/AZone"));
    }

    @ParameterizedTest
    @CsvSource({"DAILY,UTC", "WEEKLY,Africa/Douala", "MONTHLY,Europe/Paris", "YEARLY,Pacific/Niue"})
    void bucketsAreStrictlyIncreasingAndInsideBounds(Period period, String zoneId) {
        ZoneId zone = ZoneId.of(zoneId);
        ResolvedPeriod p = resolver.resolve(period, zone, Instant.parse("2026-03-29T10:00:00Z"));
        assertTrue(p.startUtc().isBefore(p.endUtc()));
        assertEquals(p.startZoned(), p.bucketStarts().get(0));
        for (int i = 1; i < p.bucketCount(); i++) {
            assertTrue(p.bucketStarts().get(i).isAfter(p.bucketStarts().get(i - 1)));
        }
        p.bucketStarts().forEach(b -> {
            assertTrue(!b.isBefore(p.startZoned()));
            assertTrue(b.isBefore(p.endZoned()));
        });
    }
}
