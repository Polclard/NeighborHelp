package com.neighborhelp.dto.admin;

import com.neighborhelp.model.Role;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AdminUserResponse(
        UUID id,
        String firstName,
        String lastName,
        String email,
        Role role,
        Boolean isBanned,
        OffsetDateTime createdAt,
        OffsetDateTime deletedAt
) {
}
