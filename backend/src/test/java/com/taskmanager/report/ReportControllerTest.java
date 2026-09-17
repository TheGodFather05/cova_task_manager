package com.taskmanager.report;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskmanager.task.Importance;
import com.taskmanager.task.Task;
import com.taskmanager.task.TaskRepository;
import com.taskmanager.task.TaskStatus;
import com.taskmanager.task.Urgency;
import com.taskmanager.user.User;
import com.taskmanager.user.UserRepository;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ReportControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private TaskRepository taskRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private String tokenA;
    private User userA;
    private User userB;

    @BeforeEach
    void setUp() throws Exception {
        String emailA = "rep-a-" + System.nanoTime() + "@example.com";
        tokenA = register(emailA);
        userA = userRepository.findByEmail(emailA).orElseThrow();
        userB = userRepository.save(User.builder()
                .email("rep-b-" + System.nanoTime() + "@example.com")
                .password(passwordEncoder.encode("password123")).build());
    }

    private String register(String email) throws Exception {
        String body = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"password123\"}"))
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("token").asText();
    }

    // completedAt is seeded explicitly in UTC so these tests document the storage convention
    private void seedCompleted(User user, String completedAtUtc,
                               Importance importance, Urgency urgency) {
        taskRepository.save(Task.builder()
                .title("seeded")
                .status(TaskStatus.DONE)
                .importance(importance)
                .urgency(urgency)
                .completedAt(LocalDateTime.parse(completedAtUtc))
                .user(user)
                .build());
    }

    private String today() {
        return LocalDateTime.now(java.time.ZoneOffset.UTC).toLocalDate().toString();
    }

    @Test
    void summaryRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/reports/summary?period=DAILY"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void invalidPeriodIsBadRequest() throws Exception {
        mockMvc.perform(get("/api/reports/summary?period=FORTNIGHTLY")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void invalidZoneIsBadRequest() throws Exception {
        mockMvc.perform(get("/api/reports/summary?period=DAILY&zone=Not/AZone")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isBadRequest());
    }

    @Test
    void outOfRangeYearIsBadRequest() throws Exception {
        mockMvc.perform(get("/api/reports/heatmap?year=1999")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isBadRequest());
    }

    @Test
    void trendReturnsEveryBucketIncludingZeros() throws Exception {
        seedCompleted(userA, today() + "T10:30", Importance.IMPORTANT, Urgency.URGENT);
        mockMvc.perform(get("/api/reports/trend?period=DAILY&zone=UTC")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bucketUnit").value("HOURS"))
                .andExpect(jsonPath("$.points.length()").value(24))
                .andExpect(jsonPath("$.points[10].count").value(1))
                .andExpect(jsonPath("$.points[0].count").value(0));
    }

    @Test
    void quadrantsAlwaysReturnsAllFourInStableOrder() throws Exception {
        seedCompleted(userA, today() + "T09:00", Importance.IMPORTANT, Urgency.URGENT);
        mockMvc.perform(get("/api/reports/quadrants?period=DAILY&zone=UTC")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quadrants.length()").value(4))
                .andExpect(jsonPath("$.quadrants[0].quadrant").value("DO_FIRST"))
                .andExpect(jsonPath("$.quadrants[0].count").value(1))
                .andExpect(jsonPath("$.quadrants[3].quadrant").value("DROP"))
                .andExpect(jsonPath("$.quadrants[3].count").value(0));
    }

    @Test
    void aggregatesCountOnlyTheCurrentUsersTasks() throws Exception {
        seedCompleted(userA, today() + "T08:00", Importance.IMPORTANT, Urgency.URGENT);
        seedCompleted(userB, today() + "T08:00", Importance.IMPORTANT, Urgency.URGENT);
        seedCompleted(userB, today() + "T09:00", Importance.NOT_IMPORTANT, Urgency.URGENT);

        mockMvc.perform(get("/api/reports/quadrants?period=DAILY&zone=UTC")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.quadrants[0].count").value(1))
                .andExpect(jsonPath("$.quadrants[2].count").value(0));
    }

    @Test
    void distributionCountsOpenTasksOnly() throws Exception {
        seedCompleted(userA, today() + "T08:00", Importance.IMPORTANT, Urgency.URGENT);
        taskRepository.save(Task.builder().title("open").status(TaskStatus.TODO)
                .importance(Importance.NOT_IMPORTANT).urgency(Urgency.NOT_URGENT)
                .user(userA).build());

        mockMvc.perform(get("/api/reports/distribution")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.quadrants[3].quadrant").value("DROP"))
                .andExpect(jsonPath("$.quadrants[3].count").value(1))
                .andExpect(jsonPath("$.asOf").isNotEmpty());
    }

    @Test
    void heatmapReturnsEveryDayOfTheYear() throws Exception {
        mockMvc.perform(get("/api/reports/heatmap?year=2026&zone=UTC")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.days.length()").value(365))
                .andExpect(jsonPath("$.year").value(2026));
    }

    @Test
    void heatmapCoversLeapYear() throws Exception {
        mockMvc.perform(get("/api/reports/heatmap?year=2024&zone=UTC")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.days.length()").value(366));
    }

    @Test
    void heatmapRejectsYearTooFarInTheFuture() throws Exception {
        mockMvc.perform(get("/api/reports/heatmap?year=2099&zone=UTC")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isBadRequest());
    }

    @Test
    void summaryExposesRateAndPartialPeriodFlag() throws Exception {
        seedCompleted(userA, today() + "T08:00", Importance.IMPORTANT, Urgency.URGENT);
        mockMvc.perform(get("/api/reports/summary?period=DAILY&zone=UTC")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentPeriodComplete").value(false))
                .andExpect(jsonPath("$.current.tasksCompleted").value(1))
                .andExpect(jsonPath("$.previous").isNotEmpty())
                .andExpect(jsonPath("$.delta").isNotEmpty());
    }

    @Test
    void summaryRateIsNullWhenNothingWasCreated() throws Exception {
        mockMvc.perform(get("/api/reports/summary?period=YEARLY&zone=UTC")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.previous.tasksCreated").value(0))
                .andExpect(jsonPath("$.previous.completionRate").doesNotExist())
                .andExpect(jsonPath("$.delta.tasksCreatedPercent").doesNotExist());
    }

    @Test
    void nonUtcZoneShiftsDayBoundaries() throws Exception {
        // 23:30 UTC is already the next day in Africa/Douala (UTC+1)
        String yesterday = LocalDateTime.now(java.time.ZoneOffset.UTC)
                .toLocalDate().minusDays(1).toString();
        seedCompleted(userA, yesterday + "T23:30", Importance.IMPORTANT, Urgency.URGENT);

        mockMvc.perform(get("/api/reports/quadrants?period=DAILY&zone=Africa/Douala")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1));

        mockMvc.perform(get("/api/reports/quadrants?period=DAILY&zone=UTC")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(0));
    }
}
