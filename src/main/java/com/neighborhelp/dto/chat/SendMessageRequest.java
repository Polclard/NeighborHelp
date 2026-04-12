package com.neighborhelp.dto.chat;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record SendMessageRequest(
        @NotNull(message = "Conversation id is required")
        UUID conversationId,

        @Size(max = 4000, message = "Message content must be at most 4000 characters")
        String content,

        @Size(max = 500, message = "Image URL must be at most 500 characters")
        String imageUrl
) {
}
