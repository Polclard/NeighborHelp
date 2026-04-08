package com.neighborhelp.dto.post;

import java.time.OffsetDateTime;
import java.util.UUID;

public record PostPhotoResponse(
    UUID id,
    String filePath,
    OffsetDateTime uploadedAt
) {
}
