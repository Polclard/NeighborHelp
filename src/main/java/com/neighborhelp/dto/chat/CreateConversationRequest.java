package com.neighborhelp.dto.chat;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateConversationRequest(
        @NotNull(message = "Recipient user id is required")
        UUID recipientUserId,

        UUID postId
) {
}
