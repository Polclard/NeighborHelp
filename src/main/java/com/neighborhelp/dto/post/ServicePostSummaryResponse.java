package com.neighborhelp.dto.post;

import com.neighborhelp.model.PostStatus;
import com.neighborhelp.model.PostType;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record ServicePostSummaryResponse(
    UUID id,
    UUID userId,
    String title,
    String description,
    PostType postType,
    PostStatus status,
    String category,
    BigDecimal latitude,
    BigDecimal longitude,
    String addressLabel,
    OffsetDateTime createdAt
) {
}
