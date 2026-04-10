package com.neighborhelp.dto.chat;

import com.neighborhelp.model.PostStatus;
import com.neighborhelp.model.PostType;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ConversationResponse(
        UUID id,
        UUID otherUserId,
        String otherUserFirstName,
        String otherUserLastName,
        String otherUserProfilePicture,
        UUID postId,
        String postTitle,
        PostType postType,
        PostStatus postStatus,
        OffsetDateTime createdAt
) {
}