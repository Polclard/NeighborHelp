package com.neighborhelp.dto.chat;

import java.time.OffsetDateTime;
import java.util.UUID;

public record MessageResponse(
        UUID id,
        UUID conversationId,
        UUID senderId,
        String content,
        String imageUrl,
        OffsetDateTime sentAt,
        OffsetDateTime readAt
) {
}