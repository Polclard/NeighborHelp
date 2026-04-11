package com.neighborhelp.dto.chat;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record SendMessageRequest(
        @NotNull
        UUID conversationId,

        @Size(max = 4000)
        String content,

        @Size(max = 500)
        String imageUrl
) {
}
