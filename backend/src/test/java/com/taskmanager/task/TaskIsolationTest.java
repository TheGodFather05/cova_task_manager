package com.taskmanager.task;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
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
class TaskIsolationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String tokenA;
    private String tokenB;

    @BeforeEach
    void setUp() throws Exception {
        tokenA = register("owner-" + System.nanoTime() + "@example.com");
        tokenB = register("intruder-" + System.nanoTime() + "@example.com");
    }

    private String register(String email) throws Exception {
        String response = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"password123\"}"))
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("token").asText();
    }

    private long createTask(String token) throws Exception {
        String response = mockMvc.perform(post("/api/tasks")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"owned task","status":"TODO",
                                 "importance":"IMPORTANT","urgency":"URGENT"}"""))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("id").asLong();
    }

    @Test
    void otherUserGets404OnEveryOperation() throws Exception {
        long id = createTask(tokenA);
        String body = """
                {"title":"hijacked","status":"DONE",
                 "importance":"NOT_IMPORTANT","urgency":"NOT_URGENT"}""";

        mockMvc.perform(get("/api/tasks/" + id).header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isNotFound());
        mockMvc.perform(put("/api/tasks/" + id).header("Authorization", "Bearer " + tokenB)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isNotFound());
        mockMvc.perform(delete("/api/tasks/" + id).header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isNotFound());

        // the owner still sees it: B's attempts changed nothing
        mockMvc.perform(get("/api/tasks/" + id).header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("owned task"));
    }

    @Test
    void listNeverLeaksAnotherUsersTasks() throws Exception {
        createTask(tokenA);
        mockMvc.perform(get("/api/tasks").header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void requiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/tasks")).andExpect(status().isUnauthorized());
    }

    @Test
    void quadrantIsDerivedAndIgnoredOnWrite() throws Exception {
        String response = mockMvc.perform(post("/api/tasks")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"t","status":"TODO","importance":"IMPORTANT",
                                 "urgency":"URGENT","quadrant":"DROP"}"""))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        // sent DROP, but IMPORTANT+URGENT must derive DO_FIRST
        JsonNode created = objectMapper.readTree(response);
        org.junit.jupiter.api.Assertions.assertEquals("DO_FIRST", created.get("quadrant").asText());
    }

    @Test
    void rejectsTaskWithoutClassification() throws Exception {
        mockMvc.perform(post("/api/tasks")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"no axes\",\"status\":\"TODO\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.importance").isNotEmpty())
                .andExpect(jsonPath("$.errors.urgency").isNotEmpty());
    }

    @Test
    void invalidEnumValueIsBadRequestNotServerError() throws Exception {
        mockMvc.perform(get("/api/tasks?quadrant=NOT_A_QUADRANT")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }
}
