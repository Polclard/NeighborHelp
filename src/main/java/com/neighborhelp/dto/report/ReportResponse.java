package com.neighborhelp.dto.report;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ReportResponse(
        UUID id,
        UUID reporterId,
        UUID reportedPostId,
        UUID reportedReviewId,
        String reason,
        Boolean resolved,
        OffsetDateTime createdAt
) {
}