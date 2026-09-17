package com.taskmanager.report;

import com.taskmanager.report.projection.BucketAggregate;
import com.taskmanager.report.projection.QuadrantAggregate;
import com.taskmanager.task.Task;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

// aggregation runs in the database; these queries never return task rows
public interface ReportRepository extends Repository<Task, Long> {

    @Query("""
            select count(t) from Task t
            where t.user.id = :userId
              and t.createdAt >= :start and t.createdAt < :end
            """)
    long countCreated(@Param("userId") Long userId,
                      @Param("start") LocalDateTime start,
                      @Param("end") LocalDateTime end);

    @Query("""
            select count(t) from Task t
            where t.user.id = :userId
              and t.status = com.taskmanager.task.TaskStatus.DONE
              and t.completedAt >= :start and t.completedAt < :end
            """)
    long countCompleted(@Param("userId") Long userId,
                        @Param("start") LocalDateTime start,
                        @Param("end") LocalDateTime end);

    @Query("""
            select t.importance as importance, t.urgency as urgency, count(t) as count
            from Task t
            where t.user.id = :userId
              and t.status = com.taskmanager.task.TaskStatus.DONE
              and t.completedAt >= :start and t.completedAt < :end
            group by t.importance, t.urgency
            """)
    List<QuadrantAggregate> aggregateCompletedByQuadrant(@Param("userId") Long userId,
                                                         @Param("start") LocalDateTime start,
                                                         @Param("end") LocalDateTime end);

    @Query("""
            select t.importance as importance, t.urgency as urgency, count(t) as count
            from Task t
            where t.user.id = :userId
              and t.status <> com.taskmanager.task.TaskStatus.DONE
            group by t.importance, t.urgency
            """)
    List<QuadrantAggregate> aggregateOpenByQuadrant(@Param("userId") Long userId);

    // extract() is portable: Hibernate renders it per dialect, so MySQL and H2 agree
    @Query("""
            select extract(year from t.completedAt) as y,
                   extract(month from t.completedAt) as m,
                   extract(day from t.completedAt) as d,
                   extract(hour from t.completedAt) as h,
                   count(t) as count
            from Task t
            where t.user.id = :userId
              and t.status = com.taskmanager.task.TaskStatus.DONE
              and t.completedAt >= :start and t.completedAt < :end
            group by extract(year from t.completedAt), extract(month from t.completedAt),
                     extract(day from t.completedAt), extract(hour from t.completedAt)
            """)
    List<BucketAggregate> aggregateCompletedByHour(@Param("userId") Long userId,
                                                   @Param("start") LocalDateTime start,
                                                   @Param("end") LocalDateTime end);
}
