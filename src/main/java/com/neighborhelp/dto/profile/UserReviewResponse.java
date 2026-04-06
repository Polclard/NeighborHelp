package com.neighborhelp.dto.profile;

import java.time.OffsetDateTime;
import java.util.UUID;

public record UserReviewResponse(
    UUID id,
    UUID postId,
    UUID reviewerId,
    String reviewerFirstName,
    String reviewerLastName,
    Integer rating,
    String comment,
    OffsetDateTime createdAt
) {
}
