package com.neighborhelp.service;

import com.neighborhelp.dto.chat.ConversationResponse;
import com.neighborhelp.dto.chat.CreateConversationRequest;
import com.neighborhelp.dto.chat.MessagePageResponse;

import java.util.List;
import java.util.UUID;

public interface ConversationService {

    ConversationResponse createConversation(UUID currentUserId, CreateConversationRequest request);

    List<ConversationResponse> getMyConversations(UUID currentUserId);

    MessagePageResponse getConversationMessages(UUID currentUserId, UUID conversationId, int page, int size);
}