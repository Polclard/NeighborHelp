package com.neighborhelp.websocket;

import com.neighborhelp.dto.chat.ChatDispatchResult;
import com.neighborhelp.dto.chat.SendMessageRequest;
import com.neighborhelp.exception.UnauthorizedException;
import com.neighborhelp.security.AuthenticatedUser;
import com.neighborhelp.service.MessageService;
import jakarta.validation.Valid;
import org.springframework.context.annotation.Profile;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@Profile("!test")
public class ChatWebSocketController {

    private final MessageService messageService;
    private final SimpMessagingTemplate simpMessagingTemplate;

    public ChatWebSocketController(
            MessageService messageService,
            SimpMessagingTemplate simpMessagingTemplate
    ) {
        this.messageService = messageService;
        this.simpMessagingTemplate = simpMessagingTemplate;
    }

    @MessageMapping("/chat.send")
    public void sendMessage(Principal principal, @Valid SendMessageRequest request) {
        if (!(principal instanceof Authentication authentication)
                || !(authentication.getPrincipal() instanceof AuthenticatedUser user)) {
            throw new UnauthorizedException("WebSocket user is not authenticated");
        }

        ChatDispatchResult result = messageService.sendMessage(user.getId(), request);

        simpMessagingTemplate.convertAndSendToUser(
                result.senderUsername(),
                "/queue/messages",
                result.message()
        );

        if (!result.senderUsername().equals(result.recipientUsername())) {
            simpMessagingTemplate.convertAndSendToUser(
                    result.recipientUsername(),
                    "/queue/messages",
                    result.message()
            );
        }
    }
}