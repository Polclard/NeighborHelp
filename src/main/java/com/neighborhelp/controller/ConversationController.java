package com.neighborhelp.controller;

import com.neighborhelp.dto.chat.ConversationResponse;
import com.neighborhelp.dto.chat.CreateConversationRequest;
import com.neighborhelp.dto.chat.MessagePageResponse;
import com.neighborhelp.security.AuthenticatedUser;
import com.neighborhelp.service.ConversationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.context.annotation.Profile;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@Validated
@Profile("!test")
public class ConversationController {

    private final ConversationService conversationService;

    public ConversationController(ConversationService conversationService) {
        this.conversationService = conversationService;
    }

    @PostMapping("/api/conversations")
    public ConversationResponse createConversation(
            Authentication authentication,
            @Valid @RequestBody CreateConversationRequest request
    ) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return conversationService.createConversation(user.getId(), request);
    }

    @GetMapping("/api/conversations")
    public List<ConversationResponse> getMyConversations(Authentication authentication) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return conversationService.getMyConversations(user.getId());
    }

    @GetMapping("/api/conversations/{conversationId}/messages")
    public MessagePageResponse getConversationMessages(
            Authentication authentication,
            @PathVariable UUID conversationId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
    ) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return conversationService.getConversationMessages(user.getId(), conversationId, page, size);
    }
}