package com.neighborhelp.dto.chat;

import java.util.List;

public record MessagePageResponse(
        List<MessageResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean last
) {
}