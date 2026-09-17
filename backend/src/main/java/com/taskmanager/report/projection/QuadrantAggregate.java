package com.taskmanager.report.projection;

import com.taskmanager.task.Importance;
import com.taskmanager.task.Urgency;

public interface QuadrantAggregate {

    Importance getImportance();

    Urgency getUrgency();

    long getCount();
}
