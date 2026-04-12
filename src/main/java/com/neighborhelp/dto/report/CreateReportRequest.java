package com.neighborhelp.dto.report;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateReportRequest(
        @NotBlank(message = "Reason is required")
        @Size(max = 2000, message = "Reason must be at most 2000 characters")
        String reason
) {
}
