package com.neighborhelp.dto.admin;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AdminReportResponse(
        UUID id,
        UUID reporterId,
        String reporterEmail,
        UUID reportedPostId,
        String reportedPostTitle,
        UUID reportedReviewId,
        Integer reportedReviewRating,
        String reportedReviewComment,
        String reason,
        Boolean resolved,
        UUID resolvedBy,
        OffsetDateTime resolvedAt,
        OffsetDateTime createdAt
) {
}