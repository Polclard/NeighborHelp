package com.neighborhelp.dto.post;

import com.neighborhelp.model.PostStatus;
import jakarta.validation.constraints.NotNull;

public record UpdatePostStatusRequest(
        @NotNull
        PostStatus status
) {
}