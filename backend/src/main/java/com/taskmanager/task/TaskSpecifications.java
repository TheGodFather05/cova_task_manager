package com.taskmanager.task;

import com.taskmanager.task.dto.TaskFilter;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;

public final class TaskSpecifications {

    private TaskSpecifications() {
    }

    // the owner predicate is unconditional; every other clause is additive
    public static Specification<Task> ownedBy(Long userId, TaskFilter filter) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(builder.equal(root.get("user").get("id"), userId));

            if (filter.status() != null) {
                predicates.add(builder.equal(root.get("status"), filter.status()));
            }

            Importance importance = filter.importance();
            Urgency urgency = filter.urgency();
            if (filter.quadrant() != null) {
                // a quadrant filter is translated here; it never reaches the database as itself
                importance = filter.quadrant().importance();
                urgency = filter.quadrant().urgency();
            }
            if (importance != null) {
                predicates.add(builder.equal(root.get("importance"), importance));
            }
            if (urgency != null) {
                predicates.add(builder.equal(root.get("urgency"), urgency));
            }

            if (filter.search() != null && !filter.search().isBlank()) {
                String pattern = "%" + filter.search().trim().toLowerCase() + "%";
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("title")), pattern),
                        builder.like(builder.lower(root.get("description")), pattern)));
            }

            return builder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
