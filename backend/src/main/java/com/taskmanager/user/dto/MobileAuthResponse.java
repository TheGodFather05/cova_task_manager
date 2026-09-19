package com.taskmanager.user.dto;

/**
 * Body returned to native clients, which have no cookie jar. The refresh token is safe to
 * expose here because the app stores it in the platform keychain, where the XSS exposure that
 * motivates the httpOnly cookie does not exist.
 */
public record MobileAuthResponse(String token, String email, String refreshToken) {

    public static MobileAuthResponse from(AuthResponse response) {
        return new MobileAuthResponse(response.token(), response.email(), response.refreshToken());
    }
}
