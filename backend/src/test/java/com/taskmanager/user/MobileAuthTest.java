package com.taskmanager.user;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MobileAuthTest {

    private static final String CLIENT = "X-Client";
    private static final String REFRESH = "X-Refresh-Token";

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    private MockHttpServletResponse registerAs(String client) throws Exception {
        var request = post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"mob-" + System.nanoTime()
                        + "@example.com\",\"password\":\"password123\"}");
        if (client != null) {
            request = request.header(CLIENT, client);
        }
        return mockMvc.perform(request).andExpect(status().isCreated())
                .andReturn().getResponse();
    }

    @Test
    void mobileClientsReceiveTheRefreshTokenInTheBody() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .header(CLIENT, "mobile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"mob-body-" + System.nanoTime()
                                + "@example.com\",\"password\":\"password123\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty());
    }

    // the whole point of the httpOnly cookie: a browser must never see this value
    @Test
    void browsersStillGetNoRefreshTokenInTheBody() throws Exception {
        MockHttpServletResponse response = registerAs(null);
        var json = objectMapper.readTree(response.getContentAsString());
        org.junit.jupiter.api.Assertions.assertTrue(json.get("refreshToken") == null,
                "the web response must not expose the refresh token");
        assertNotNull(response.getCookie("refresh_token"), "but the cookie is still set");
    }

    @Test
    void mobileCanRefreshWithTheHeaderInsteadOfACookie() throws Exception {
        MockHttpServletResponse registered = registerAs("mobile");
        String refreshToken = objectMapper.readTree(registered.getContentAsString())
                .get("refreshToken").asText();

        mockMvc.perform(post("/api/auth/refresh")
                        .header(CLIENT, "mobile")
                        .header(REFRESH, refreshToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty());
    }

    @Test
    void rotationStillAppliesToHeaderBasedRefresh() throws Exception {
        MockHttpServletResponse registered = registerAs("mobile");
        String first = objectMapper.readTree(registered.getContentAsString())
                .get("refreshToken").asText();

        mockMvc.perform(post("/api/auth/refresh").header(CLIENT, "mobile").header(REFRESH, first))
                .andExpect(status().isOk());

        // replaying the consumed token is theft, header path or not
        mockMvc.perform(post("/api/auth/refresh").header(CLIENT, "mobile").header(REFRESH, first))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void refreshWithoutCookieOrHeaderIsUnauthorized() throws Exception {
        mockMvc.perform(post("/api/auth/refresh").header(CLIENT, "mobile"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void mobileLogoutRevokesViaHeader() throws Exception {
        MockHttpServletResponse registered = registerAs("mobile");
        String refreshToken = objectMapper.readTree(registered.getContentAsString())
                .get("refreshToken").asText();

        mockMvc.perform(post("/api/auth/logout").header(REFRESH, refreshToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/auth/refresh").header(CLIENT, "mobile").header(REFRESH, refreshToken))
                .andExpect(status().isUnauthorized());
    }
}
