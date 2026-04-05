package com.neighborhelp.dto.auth;

import com.neighborhelp.model.Role;

import java.util.UUID;

public record AuthTokens(
        String accessToken,
        String refreshToken,
        long expiresIn,
        UUID userId,
        String firstName,
        String lastName,
        String email,
        Role role
) {
}
