package com.taskmanager.user;

import com.taskmanager.common.ApiError;
import com.taskmanager.common.exception.InvalidRefreshTokenException;
import com.taskmanager.security.RefreshCookie;
import com.taskmanager.user.dto.AuthResponse;
import com.taskmanager.user.dto.LoginRequest;
import com.taskmanager.user.dto.RegisterRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "auth", description = "Registration, login and token rotation")
@SecurityRequirements
public class AuthController {

    private final AuthService authService;
    private final RefreshCookie refreshCookie;

    @PostMapping("/register")
    @Operation(summary = "Register a new account and return a JWT")
    @ApiResponse(responseCode = "201", description = "Account created")
    @ApiResponse(responseCode = "400", description = "Validation failed",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "Email already used",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return withRefreshCookie(authService.register(request), HttpStatus.CREATED);
    }

    @PostMapping("/login")
    @Operation(summary = "Exchange credentials for a JWT")
    @ApiResponse(responseCode = "200", description = "Authenticated")
    @ApiResponse(responseCode = "400", description = "Validation failed",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "Invalid credentials",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return withRefreshCookie(authService.login(request), HttpStatus.OK);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Rotate the refresh cookie and return a fresh JWT")
    @ApiResponse(responseCode = "200", description = "New access token issued")
    @ApiResponse(responseCode = "401", description = "Missing, expired, revoked or replayed token",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ResponseEntity<AuthResponse> refresh(HttpServletRequest request) {
        String rawToken = refreshCookie.read(request)
                .orElseThrow(() -> new InvalidRefreshTokenException("no refresh cookie"));
        return withRefreshCookie(authService.refresh(rawToken), HttpStatus.OK);
    }

    @PostMapping("/logout")
    @Operation(summary = "Revoke the refresh token family and clear the cookie")
    @ApiResponse(responseCode = "204", description = "Logged out")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        refreshCookie.read(request).ifPresent(authService::logout);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, refreshCookie.clear())
                .build();
    }

    // the refresh token leaves only through the httpOnly cookie, never through the JSON body
    private ResponseEntity<AuthResponse> withRefreshCookie(AuthResponse response,
                                                           HttpStatus status) {
        return ResponseEntity.status(status)
                .header(HttpHeaders.SET_COOKIE, refreshCookie.issue(response.refreshToken()))
                .body(response);
    }
}
