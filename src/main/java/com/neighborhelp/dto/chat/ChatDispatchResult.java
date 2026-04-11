package com.neighborhelp.dto.chat;

public record ChatDispatchResult(
        MessageResponse message,
        String senderUsername,
        String recipientUsername
) {
}
