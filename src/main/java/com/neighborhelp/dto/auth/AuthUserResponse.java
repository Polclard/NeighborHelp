package com.neighborhelp.dto.auth;

import com.neighborhelp.model.Role;

import java.util.UUID;

public record AuthUserResponse(
    UUID id,
    String firstName,
    String lastName,
    String email,
    Role role
) {
}