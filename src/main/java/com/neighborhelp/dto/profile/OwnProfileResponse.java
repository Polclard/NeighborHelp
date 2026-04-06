package com.neighborhelp.dto.profile;

import com.neighborhelp.model.Role;

import java.math.BigDecimal;
import java.util.UUID;

public record OwnProfileResponse(
    UUID id,
    String firstName,
    String lastName,
    String email,
    String phoneNumber,
    String bio,
    String profilePicture,
    Role role,
    BigDecimal averageRating,
    Integer reviewCount
) {
}
