package com.taskmanager.user.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;

public record AuthResponse(String token, String email, @JsonIgnore String refreshToken) {
}
