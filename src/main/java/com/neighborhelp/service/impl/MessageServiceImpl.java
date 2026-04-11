package com.neighborhelp.service.impl;

import com.neighborhelp.dto.chat.ChatDispatchResult;
import com.neighborhelp.dto.chat.MessageResponse;
import com.neighborhelp.dto.chat.SendMessageRequest;
import com.neighborhelp.exception.ForbiddenException;
import com.neighborhelp.exception.NotFoundException;
import com.neighborhelp.model.Conversation;
import com.neighborhelp.model.Message;
import com.neighborhelp.model.User;
import com.neighborhelp.repository.ConversationRepository;
import com.neighborhelp.repository.MessageRepository;
import com.neighborhelp.repository.UserRepository;
import com.neighborhelp.service.MessageService;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
@Profile("!test")
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;

    public MessageServiceImpl(
            MessageRepository messageRepository,
            ConversationRepository conversationRepository,
            UserRepository userRepository
    ) {
        this.messageRepository = messageRepository;
        this.conversationRepository = conversationRepository;
        this.userRepository = userRepository;
    }

    @Override
    public ChatDispatchResult sendMessage(UUID senderId, SendMessageRequest request) {
        User sender = getActiveUser(senderId);
        Conversation conversation = getConversationForParticipant(senderId, request.conversationId());

        String normalizedContent = normalizeNullable(request.content());
        String normalizedImageUrl = normalizeNullable(request.imageUrl());

        if (normalizedContent == null && normalizedImageUrl == null) {
            throw new IllegalArgumentException("Message content or imageUrl is required");
        }

        Message message = new Message();
        message.setConversationId(conversation.getId());
        message.setSenderId(sender.getId());
        message.setContent(normalizedContent);
        message.setImageUrl(normalizedImageUrl);

        Message savedMessage = messageRepository.save(message);

        UUID recipientId = conversation.getUserAId().equals(senderId)
                ? conversation.getUserBId()
                : conversation.getUserAId();

        User recipient = getActiveUser(recipientId);

        return new ChatDispatchResult(
                toMessageResponse(savedMessage),
                sender.getEmail(),
                recipient.getEmail()
        );
    }

    private Conversation getConversationForParticipant(UUID currentUserId, UUID conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new NotFoundException("Conversation not found"));

        if (!conversation.getUserAId().equals(currentUserId) && !conversation.getUserBId().equals(currentUserId)) {
            throw new ForbiddenException("You are not a participant in this conversation");
        }

        return conversation;
    }

    private User getActiveUser(UUID userId) {
        return userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private MessageResponse toMessageResponse(Message message) {
        return new MessageResponse(
                message.getId(),
                message.getConversationId(),
                message.getSenderId(),
                message.getContent(),
                message.getImageUrl(),
                message.getSentAt(),
                message.getReadAt()
        );
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
