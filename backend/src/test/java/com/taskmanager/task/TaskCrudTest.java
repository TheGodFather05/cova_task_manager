package com.taskmanager.task;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TaskCrudTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    private String token;

    @BeforeEach
    void setUp() throws Exception {
        String body = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"crud-" + System.nanoTime()
                                + "@example.com\",\"password\":\"password123\"}"))
                .andReturn().getResponse().getContentAsString();
        token = objectMapper.readTree(body).get("token").asText();
    }

    private long create(String title, String status, String importance, String urgency)
            throws Exception {
        String body = mockMvc.perform(post("/api/tasks")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"" + title + "\",\"status\":\"" + status
                                + "\",\"importance\":\"" + importance
                                + "\",\"urgency\":\"" + urgency + "\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("id").asLong();
    }

    @Test
    void createReadUpdateDeleteRoundTrip() throws Exception {
        long id = create("write the spec", "TODO", "IMPORTANT", "NOT_URGENT");

        mockMvc.perform(get("/api/tasks/" + id).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("write the spec"))
                .andExpect(jsonPath("$.quadrant").value("SCHEDULE"));

        mockMvc.perform(put("/api/tasks/" + id).header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"write the spec","status":"IN_PROGRESS",
                                 "importance":"NOT_IMPORTANT","urgency":"URGENT"}"""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.quadrant").value("DELEGATE"));

        mockMvc.perform(delete("/api/tasks/" + id).header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/tasks/" + id).header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    void completedAtIsSetOnDoneAndClearedOnExit() throws Exception {
        long id = create("ship it", "TODO", "IMPORTANT", "URGENT");

        mockMvc.perform(get("/api/tasks/" + id).header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.completedAt").doesNotExist());

        mockMvc.perform(put("/api/tasks/" + id).header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"ship it","status":"DONE",
                                 "importance":"IMPORTANT","urgency":"URGENT"}"""))
                .andExpect(jsonPath("$.completedAt").isNotEmpty());

        mockMvc.perform(put("/api/tasks/" + id).header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"ship it","status":"TODO",
                                 "importance":"IMPORTANT","urgency":"URGENT"}"""))
                .andExpect(jsonPath("$.completedAt").doesNotExist());
    }

    @Test
    void listIsPaginatedAndFiltersServerSide() throws Exception {
        create("alpha report", "TODO", "IMPORTANT", "URGENT");
        create("beta report", "DONE", "NOT_IMPORTANT", "NOT_URGENT");
        create("gamma note", "TODO", "IMPORTANT", "URGENT");

        mockMvc.perform(get("/api/tasks?page=0&size=2").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.content.length()").value(2));

        mockMvc.perform(get("/api/tasks?quadrant=DO_FIRST")
                        .header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.totalElements").value(2));

        mockMvc.perform(get("/api/tasks?status=DONE").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.totalElements").value(1));

        mockMvc.perform(get("/api/tasks?search=report").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.totalElements").value(2));
    }
}
