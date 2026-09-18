package com.taskmanager.security;

import jakarta.servlet.http.HttpServletRequest;
import java.time.Duration;
import java.util.Arrays;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

@Component
public class RefreshCookie {

    public static final String NAME = "refresh_token";

    // scoped to the auth endpoints: the cookie is never sent with ordinary api calls
    private static final String PATH = "/api/auth";

    private final boolean secure;
    private final long refreshDays;

    public RefreshCookie(@Value("${jwt.refresh-cookie-secure}") boolean secure,
                         @Value("${jwt.refresh-days}") long refreshDays) {
        this.secure = secure;
        this.refreshDays = refreshDays;
    }

    public String issue(String rawToken) {
        return build(rawToken, Duration.ofDays(refreshDays)).toString();
    }

    public String clear() {
        return build("", Duration.ZERO).toString();
    }

    public Optional<String> read(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return Optional.empty();
        }
        return Arrays.stream(request.getCookies())
                .filter(cookie -> NAME.equals(cookie.getName()))
                .map(jakarta.servlet.http.Cookie::getValue)
                .filter(value -> value != null && !value.isBlank())
                .findFirst();
    }

    private ResponseCookie build(String value, Duration maxAge) {
        return ResponseCookie.from(NAME, value)
                .httpOnly(true)
                .secure(secure)
                .sameSite("Strict")
                .path(PATH)
                .maxAge(maxAge)
                .build();
    }
}
