package com.taskmanager;

import java.util.TimeZone;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class TaskManagerApplication {

    public static void main(String[] args) {
        // completedAt is stored as UTC wall-clock time; date functions in report queries run in
        // the JDBC session zone, so the JVM must agree or every aggregate shifts by the offset
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
        SpringApplication.run(TaskManagerApplication.class, args);
    }
}
