package com.neighborhelp.dto.post;

import com.neighborhelp.model.PostStatus;
import com.neighborhelp.model.PostType;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record ServicePostDetailResponse(
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
        String contactPhone,
        String contactEmail,
        UUID acceptedUserId,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}