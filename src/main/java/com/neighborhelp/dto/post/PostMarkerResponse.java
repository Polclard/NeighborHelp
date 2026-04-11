package com.neighborhelp.dto.post;

import com.neighborhelp.model.PostStatus;
import com.neighborhelp.model.PostType;

import java.math.BigDecimal;
import java.util.UUID;

public record PostMarkerResponse(
        UUID id,
        String title,
        PostType postType,
        PostStatus status,
        String category,
        BigDecimal latitude,
        BigDecimal longitude
) {
}
