package com.taskmanager.config;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OpenApiDocumentationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void specIsPublicAndDeclaresBearerAuth() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.info.title").value("Task Manager API"))
                .andExpect(jsonPath("$.components.securitySchemes.bearerAuth.scheme")
                        .value("bearer"))
                .andExpect(jsonPath("$.components.securitySchemes.bearerAuth.bearerFormat")
                        .value("JWT"));
    }

    @Test
    void swaggerUiIsReachableWithoutAToken() throws Exception {
        mockMvc.perform(get("/swagger-ui/index.html")).andExpect(status().isOk());
    }

    @Test
    void everyEndpointIsTaggedByDomain() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(jsonPath("$.paths['/api/auth/login'].post.tags[0]").value("auth"))
                .andExpect(jsonPath("$.paths['/api/tasks'].get.tags[0]").value("tasks"))
                .andExpect(jsonPath("$.paths['/api/reports/summary'].get.tags[0]")
                        .value("reports"));
    }

    @Test
    void authRoutesAreDocumentedAsPublic() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(jsonPath("$.paths['/api/auth/register'].post.security").isEmpty())
                .andExpect(jsonPath("$.paths['/api/auth/register'].post.responses.409")
                        .isNotEmpty());
    }

    @Test
    void enumValuesAreDocumented() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(jsonPath("$.components.schemas.TaskRequest.properties.importance.enum")
                        .isNotEmpty())
                .andExpect(jsonPath("$.components.schemas.TaskResponse.properties.quadrant.enum")
                        .isNotEmpty())
                .andExpect(jsonPath("$.paths['/api/reports/summary'].get.parameters[0].schema.enum")
                        .isNotEmpty());
    }

    // the derived quadrant must appear in output only; its absence here is the contract
    @Test
    void quadrantIsNotWritableInTheDocumentedContract() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(jsonPath("$.components.schemas.TaskRequest.properties.quadrant")
                        .doesNotExist())
                .andExpect(jsonPath("$.components.schemas.TaskResponse.properties.quadrant")
                        .isNotEmpty());
    }

    @Test
    void notFoundAndValidationCodesAreDocumented() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(jsonPath("$.paths['/api/tasks/{id}'].get.responses.404").isNotEmpty())
                .andExpect(jsonPath("$.paths['/api/tasks'].post.responses.400").isNotEmpty())
                .andExpect(jsonPath("$.paths['/api/tasks'].get.responses.401").isNotEmpty());
    }
}
