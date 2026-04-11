package com.neighborhelp.service;

import com.neighborhelp.dto.chat.ChatDispatchResult;
import com.neighborhelp.dto.chat.SendMessageRequest;

import java.util.UUID;

public interface MessageService {

    ChatDispatchResult sendMessage(UUID senderId, SendMessageRequest request);
}
