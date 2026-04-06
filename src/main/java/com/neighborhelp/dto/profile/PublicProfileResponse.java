package com.neighborhelp.dto.profile;

import java.math.BigDecimal;
import java.util.UUID;

public record PublicProfileResponse(
    UUID id,
    String firstName,
    String lastName,
    String bio,
    String profilePicture,
    BigDecimal averageRating,
    Integer reviewCount
) {
}
