package com.taskmanager.user;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;
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
class RefreshEndpointTest {

    @Autowired
    private MockMvc mockMvc;

    private MockHttpServletResponse register() throws Exception {
        return mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"ref-" + System.nanoTime()
                                + "@example.com\",\"password\":\"password123\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse();
    }

    private String cookieValue(MockHttpServletResponse response) {
        Cookie cookie = response.getCookie("refresh_token");
        assertNotNull(cookie, "refresh cookie must be set");
        return cookie.getValue();
    }

    @Test
    void refreshCookieIsHttpOnlyAndScopedToAuth() throws Exception {
        Cookie cookie = register().getCookie("refresh_token");
        assertNotNull(cookie);
        assertTrue(cookie.isHttpOnly(), "must be unreadable from JavaScript");
        assertEquals("/api/auth", cookie.getPath());
    }

    @Test
    void refreshTokenNeverAppearsInTheJsonBody() throws Exception {
        MockHttpServletResponse response = register();
        String raw = cookieValue(response);
        assertTrue(!response.getContentAsString().contains(raw),
                "the refresh token must travel in the cookie only");
    }

    @Test
    void refreshRotatesTheCookieAndReturnsAToken() throws Exception {
        String first = cookieValue(register());
        MockHttpServletResponse refreshed = mockMvc.perform(post("/api/auth/refresh")
                        .cookie(new Cookie("refresh_token", first)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn().getResponse();
        assertNotEquals(first, cookieValue(refreshed), "the cookie must rotate");
    }

    @Test
    void replayingAConsumedTokenRevokesTheFamily() throws Exception {
        String first = cookieValue(register());
        String second = cookieValue(mockMvc.perform(post("/api/auth/refresh")
                        .cookie(new Cookie("refresh_token", first)))
                .andReturn().getResponse());

        mockMvc.perform(post("/api/auth/refresh").cookie(new Cookie("refresh_token", first)))
                .andExpect(status().isUnauthorized());

        // the legitimate holder's current token dies too: theft invalidates the whole family
        mockMvc.perform(post("/api/auth/refresh").cookie(new Cookie("refresh_token", second)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void refreshWithoutACookieIsUnauthorized() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")).andExpect(status().isUnauthorized());
    }

    @Test
    void logoutRevokesTheTokenAndClearsTheCookie() throws Exception {
        String raw = cookieValue(register());
        MockHttpServletResponse out = mockMvc.perform(post("/api/auth/logout")
                        .cookie(new Cookie("refresh_token", raw)))
                .andExpect(status().isNoContent())
                .andReturn().getResponse();
        assertEquals(0, out.getCookie("refresh_token").getMaxAge(), "cookie must be cleared");

        mockMvc.perform(post("/api/auth/refresh").cookie(new Cookie("refresh_token", raw)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginAlsoIssuesARefreshCookie() throws Exception {
        MockHttpServletResponse registered = register();
        String email = com.jayway.jsonpath.JsonPath.read(registered.getContentAsString(), "$.email");

        MockHttpServletResponse login = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"password123\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse();
        assertNotNull(login.getCookie("refresh_token"));
    }
}
