package com.neighborhelp.dto.review;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ReviewResponse(
    UUID id,
    UUID postId,
    UUID reviewerId,
    UUID reviewedUserId,
    Integer rating,
    String comment,
    OffsetDateTime createdAt
) {
}
