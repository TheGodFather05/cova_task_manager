package com.taskmanager.task;

import com.taskmanager.common.exception.ResourceNotFoundException;
import com.taskmanager.security.CurrentUserService;
import com.taskmanager.task.dto.TaskFilter;
import com.taskmanager.task.dto.TaskRequest;
import com.taskmanager.task.dto.TaskResponse;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final CurrentUserService currentUserService;

    @Transactional(readOnly = true)
    public Page<TaskResponse> list(TaskFilter filter, Pageable pageable) {
        Long userId = currentUserService.requireId();
        return taskRepository
                .findAll(TaskSpecifications.ownedBy(userId, filter), pageable)
                .map(TaskResponse::from);
    }

    @Transactional(readOnly = true)
    public TaskResponse get(Long id) {
        return TaskResponse.from(findOwned(id));
    }

    @Transactional
    public TaskResponse create(TaskRequest request) {
        Task task = Task.builder()
                .title(request.title())
                .description(request.description())
                .status(request.status())
                .importance(request.importance())
                .urgency(request.urgency())
                .user(currentUserService.require())
                .build();
        applyCompletion(task, null, request.status());
        return TaskResponse.from(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse update(Long id, TaskRequest request) {
        Task task = findOwned(id);
        TaskStatus previous = task.getStatus();
        task.setTitle(request.title());
        task.setDescription(request.description());
        task.setStatus(request.status());
        task.setImportance(request.importance());
        task.setUrgency(request.urgency());
        applyCompletion(task, previous, request.status());
        return TaskResponse.from(taskRepository.save(task));
    }

    @Transactional
    public void delete(Long id) {
        taskRepository.delete(findOwned(id));
    }

    private Task findOwned(Long id) {
        // 404 not 403 — do not reveal that a task belonging to someone else exists
        return taskRepository.findByIdAndUserId(id, currentUserService.requireId())
                .orElseThrow(() -> new ResourceNotFoundException("task not found: " + id));
    }

    private void applyCompletion(Task task, TaskStatus previous, TaskStatus next) {
        if (next == TaskStatus.DONE && previous != TaskStatus.DONE) {
            task.setCompletedAt(LocalDateTime.now(ZoneOffset.UTC));
        } else if (next != TaskStatus.DONE) {
            task.setCompletedAt(null);
        }
    }
}
