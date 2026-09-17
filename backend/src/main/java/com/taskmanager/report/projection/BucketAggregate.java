package com.taskmanager.report.projection;

public interface BucketAggregate {

    int getY();

    int getM();

    int getD();

    int getH();

    long getCount();
}
