package com.taskmanager.task.dto;

import com.taskmanager.task.Importance;
import com.taskmanager.task.Quadrant;
import com.taskmanager.task.TaskStatus;
import com.taskmanager.task.Urgency;

public record TaskFilter(
        TaskStatus status,
        Importance importance,
        Urgency urgency,
        Quadrant quadrant,
        String search) {
}
