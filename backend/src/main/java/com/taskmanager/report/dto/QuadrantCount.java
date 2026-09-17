package com.taskmanager.report.dto;

import com.taskmanager.task.Quadrant;

public record QuadrantCount(Quadrant quadrant, long count, double percentage) {
}
