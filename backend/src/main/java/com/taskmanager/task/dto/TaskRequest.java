package com.taskmanager.task.dto;

import com.taskmanager.task.Importance;
import com.taskmanager.task.TaskStatus;
import com.taskmanager.task.Urgency;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// no quadrant field: it is derived from the two axes and never accepted as input
public record TaskRequest(

        @NotBlank
        @Size(max = 255)
        String title,

        @Size(max = 5000)
        String description,

        @NotNull
        TaskStatus status,

        @NotNull
        Importance importance,

        @NotNull
        Urgency urgency) {
}
