package com.taskmanager.report;

import java.time.temporal.ChronoUnit;

public enum Period {
    DAILY(ChronoUnit.HOURS),
    WEEKLY(ChronoUnit.DAYS),
    MONTHLY(ChronoUnit.DAYS),
    YEARLY(ChronoUnit.MONTHS);

    private final ChronoUnit bucketUnit;

    Period(ChronoUnit bucketUnit) {
        this.bucketUnit = bucketUnit;
    }

    public ChronoUnit bucketUnit() {
        return bucketUnit;
    }
}
