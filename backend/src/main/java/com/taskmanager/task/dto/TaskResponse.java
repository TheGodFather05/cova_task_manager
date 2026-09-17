package com.taskmanager.task.dto;

import com.taskmanager.task.Importance;
import com.taskmanager.task.Quadrant;
import com.taskmanager.task.Task;
import com.taskmanager.task.TaskStatus;
import com.taskmanager.task.Urgency;
import java.time.LocalDateTime;

public record TaskResponse(
        Long id,
        String title,
        String description,
        TaskStatus status,
        Importance importance,
        Urgency urgency,
        Quadrant quadrant,
        LocalDateTime completedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {

    public static TaskResponse from(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getStatus(),
                task.getImportance(),
                task.getUrgency(),
                task.quadrant(),
                task.getCompletedAt(),
                task.getCreatedAt(),
                task.getUpdatedAt());
    }
}
