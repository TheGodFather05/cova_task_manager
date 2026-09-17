package com.taskmanager.task;

import com.taskmanager.common.ApiError;
import com.taskmanager.task.dto.TaskFilter;
import com.taskmanager.task.dto.TaskRequest;
import com.taskmanager.task.dto.TaskResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
@Tag(name = "tasks", description = "Task CRUD, scoped to the authenticated user")
@ApiResponse(responseCode = "401", description = "Missing or invalid token",
        content = @Content(schema = @Schema(implementation = ApiError.class)))
public class TaskController {

    private final TaskService taskService;

    @GetMapping
    @Operation(summary = "List the caller's tasks, paginated and filtered server-side")
    @ApiResponse(responseCode = "200", description = "Page of tasks")
    @ApiResponse(responseCode = "400", description = "Unknown enum value in a filter",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public Page<TaskResponse> list(
            @Parameter(description = "TODO, IN_PROGRESS or DONE")
            @RequestParam(required = false) TaskStatus status,
            @Parameter(description = "IMPORTANT or NOT_IMPORTANT")
            @RequestParam(required = false) Importance importance,
            @Parameter(description = "URGENT or NOT_URGENT")
            @RequestParam(required = false) Urgency urgency,
            @Parameter(description = "DO_FIRST, SCHEDULE, DELEGATE or DROP; "
                    + "translated to an importance and urgency pair")
            @RequestParam(required = false) Quadrant quadrant,
            @Parameter(description = "Case-insensitive match on title and description")
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {
        TaskFilter filter = new TaskFilter(status, importance, urgency, quadrant, search);
        return taskService.list(filter, pageable);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get one task owned by the caller")
    @ApiResponse(responseCode = "200", description = "The task")
    @ApiResponse(responseCode = "404", description = "Unknown task, or owned by someone else",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public TaskResponse get(@PathVariable Long id) {
        return taskService.get(id);
    }

    @PostMapping
    @Operation(summary = "Create a task; importance and urgency are both required")
    @ApiResponse(responseCode = "201", description = "Task created")
    @ApiResponse(responseCode = "400", description = "Validation failed",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ResponseEntity<TaskResponse> create(@Valid @RequestBody TaskRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(taskService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Replace a task; moving to DONE stamps completedAt")
    @ApiResponse(responseCode = "400", description = "Validation failed",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "Unknown task, or owned by someone else",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public TaskResponse update(@PathVariable Long id, @Valid @RequestBody TaskRequest request) {
        return taskService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a task owned by the caller")
    @ApiResponse(responseCode = "204", description = "Deleted")
    @ApiResponse(responseCode = "404", description = "Unknown task, or owned by someone else",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        taskService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
