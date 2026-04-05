package com.neighborhelp.dto.auth;

public record AuthResponse(
    String accessToken,
    String tokenType,
    long expiresIn,
    AuthUserResponse user
) {
}
