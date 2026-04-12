package com.neighborhelp.service.impl;

import com.neighborhelp.dto.chat.ConversationResponse;
import com.neighborhelp.dto.chat.CreateConversationRequest;
import com.neighborhelp.dto.chat.MessagePageResponse;
import com.neighborhelp.dto.chat.MessageResponse;
import com.neighborhelp.exception.ConflictException;
import com.neighborhelp.exception.ForbiddenException;
import com.neighborhelp.exception.NotFoundException;
import com.neighborhelp.model.Conversation;
import com.neighborhelp.model.Message;
import com.neighborhelp.model.ServicePost;
import com.neighborhelp.model.User;
import com.neighborhelp.repository.ConversationRepository;
import com.neighborhelp.repository.MessageRepository;
import com.neighborhelp.repository.ServicePostRepository;
import com.neighborhelp.repository.UserRepository;
import com.neighborhelp.service.ConversationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ConversationServiceImpl implements ConversationService {

    private static final int MAX_PAGE_SIZE = 100;

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ServicePostRepository servicePostRepository;

    public ConversationServiceImpl(
            ConversationRepository conversationRepository,
            MessageRepository messageRepository,
            UserRepository userRepository,
            ServicePostRepository servicePostRepository
    ) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.servicePostRepository = servicePostRepository;
    }

    @Override
    public ConversationResponse createConversation(UUID currentUserId, CreateConversationRequest request) {
        getActiveUser(currentUserId);

        if (currentUserId.equals(request.recipientUserId())) {
            throw new ConflictException("You cannot start a conversation with yourself");
        }

        User recipient = getActiveUser(request.recipientUserId());
        ServicePost post = resolveConversationPost(currentUserId, recipient.getId(), request.postId());

        Conversation conversation = conversationRepository.findBetweenUsersAndPost(
                currentUserId,
                recipient.getId(),
                request.postId()
        ).orElseGet(() -> {
            Conversation created = new Conversation();
            setParticipants(created, currentUserId, recipient.getId());
            created.setPostId(post != null ? post.getId() : null);
            return conversationRepository.save(created);
        });

        return toConversationResponse(conversation, currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConversationResponse> getMyConversations(UUID currentUserId) {
        getActiveUser(currentUserId);

        return conversationRepository.findAllByUserAIdOrUserBIdOrderByCreatedAtDesc(currentUserId, currentUserId)
                .stream()
                .map(conversation -> toConversationResponse(conversation, currentUserId))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public MessagePageResponse getConversationMessages(UUID currentUserId, UUID conversationId, int page, int size) {
        Conversation conversation = getConversationForParticipant(currentUserId, conversationId);

        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);

        Page<Message> messagePage = messageRepository.findAllByConversationIdAndDeletedAtIsNullOrderBySentAtAsc(
                conversation.getId(),
                PageRequest.of(safePage, safeSize)
        );

        List<MessageResponse> content = messagePage.getContent().stream()
                .map(this::toMessageResponse)
                .toList();

        return new MessagePageResponse(
                content,
                messagePage.getNumber(),
                messagePage.getSize(),
                messagePage.getTotalElements(),
                messagePage.getTotalPages(),
                messagePage.isLast()
        );
    }

    private ServicePost resolveConversationPost(UUID currentUserId, UUID recipientUserId, UUID postId) {
        if (postId == null) {
            return null;
        }

        ServicePost post = servicePostRepository.findByIdAndDeletedAtIsNull(postId)
                .orElseThrow(() -> new NotFoundException("Post not found"));

        if (post.getUserId().equals(currentUserId)) {
            throw new ConflictException("You cannot start a conversation on your own post");
        }

        if (!post.getUserId().equals(recipientUserId)) {
            throw new ConflictException("Recipient must be the owner of the selected post");
        }

        return post;
    }

    private Conversation getConversationForParticipant(UUID currentUserId, UUID conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new NotFoundException("Conversation not found"));

        if (!conversation.getUserAId().equals(currentUserId) && !conversation.getUserBId().equals(currentUserId)) {
            throw new ForbiddenException("You are not a participant in this conversation");
        }

        return conversation;
    }

    private ConversationResponse toConversationResponse(Conversation conversation, UUID currentUserId) {
        UUID otherUserId = conversation.getUserAId().equals(currentUserId)
                ? conversation.getUserBId()
                : conversation.getUserAId();

        User otherUser = userRepository.findById(otherUserId)
                .orElseThrow(() -> new NotFoundException("Conversation user not found"));

        ServicePost post = conversation.getPostId() == null
                ? null
                : servicePostRepository.findById(conversation.getPostId()).orElse(null);

        return new ConversationResponse(
                conversation.getId(),
                otherUser.getId(),
                otherUser.getFirstName(),
                otherUser.getLastName(),
                otherUser.getProfilePicture(),
                conversation.getPostId(),
                post != null ? post.getTitle() : null,
                post != null ? post.getPostType() : null,
                post != null ? post.getStatus() : null,
                conversation.getCreatedAt()
        );
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

    private User getActiveUser(UUID userId) {
        return userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private void setParticipants(Conversation conversation, UUID firstUserId, UUID secondUserId) {
        if (firstUserId.compareTo(secondUserId) <= 0) {
            conversation.setUserAId(firstUserId);
            conversation.setUserBId(secondUserId);
        } else {
            conversation.setUserAId(secondUserId);
            conversation.setUserBId(firstUserId);
        }
    }
}