package com.neighborhelp.dto.chat;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateConversationRequest(
        @NotNull
        UUID recipientUserId,

        UUID postId
) {
}
