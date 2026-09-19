package com.taskmanager.user;

import com.taskmanager.common.ApiError;
import com.taskmanager.common.exception.InvalidRefreshTokenException;
import com.taskmanager.security.RefreshCookie;
import com.taskmanager.user.dto.AuthResponse;
import com.taskmanager.user.dto.MobileAuthResponse;
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
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "auth", description = "Registration, login and token rotation")
@SecurityRequirements
public class AuthController {

    static final String CLIENT_HEADER = "X-Client";
    static final String REFRESH_HEADER = "X-Refresh-Token";
    private static final String MOBILE = "mobile";

    private final AuthService authService;
    private final RefreshCookie refreshCookie;

    @PostMapping("/register")
    @Operation(summary = "Register a new account and return a JWT")
    @ApiResponse(responseCode = "201", description = "Account created")
    @ApiResponse(responseCode = "400", description = "Validation failed",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "Email already used",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request,
                                      @RequestHeader(value = CLIENT_HEADER, required = false)
                                      String client) {
        return respond(authService.register(request), HttpStatus.CREATED, client);
    }

    @PostMapping("/login")
    @Operation(summary = "Exchange credentials for a JWT")
    @ApiResponse(responseCode = "200", description = "Authenticated")
    @ApiResponse(responseCode = "400", description = "Validation failed",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "Invalid credentials",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request,
                                   @RequestHeader(value = CLIENT_HEADER, required = false)
                                   String client) {
        return respond(authService.login(request), HttpStatus.OK, client);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Rotate the refresh cookie and return a fresh JWT")
    @ApiResponse(responseCode = "200", description = "New access token issued")
    @ApiResponse(responseCode = "401", description = "Missing, expired, revoked or replayed token",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ResponseEntity<?> refresh(HttpServletRequest request,
                                     @RequestHeader(value = CLIENT_HEADER, required = false)
                                     String client,
                                     @RequestHeader(value = REFRESH_HEADER, required = false)
                                     String headerToken) {
        // browsers send the cookie; native clients send the header they were given at login
        String rawToken = refreshCookie.read(request)
                .or(() -> java.util.Optional.ofNullable(headerToken).filter(t -> !t.isBlank()))
                .orElseThrow(() -> new InvalidRefreshTokenException("no refresh token"));
        return respond(authService.refresh(rawToken), HttpStatus.OK, client);
    }

    @PostMapping("/logout")
    @Operation(summary = "Revoke the refresh token family and clear the cookie")
    @ApiResponse(responseCode = "204", description = "Logged out")
    public ResponseEntity<Void> logout(HttpServletRequest request,
                                       @RequestHeader(value = REFRESH_HEADER, required = false)
                                       String headerToken) {
        refreshCookie.read(request)
                .or(() -> java.util.Optional.ofNullable(headerToken).filter(t -> !t.isBlank()))
                .ifPresent(authService::logout);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, refreshCookie.clear())
                .build();
    }

    /**
     * Browsers get the refresh token only through the httpOnly cookie. Native clients, which
     * have no cookie jar, additionally get it in the body and keep it in the platform keychain.
     */
    private ResponseEntity<?> respond(AuthResponse response, HttpStatus status, String client) {
        ResponseEntity.BodyBuilder builder = ResponseEntity.status(status)
                .header(HttpHeaders.SET_COOKIE, refreshCookie.issue(response.refreshToken()));
        return MOBILE.equalsIgnoreCase(client)
                ? builder.body(MobileAuthResponse.from(response))
                : builder.body(response);
    }
}
