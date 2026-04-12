package com.neighborhelp.dto.report;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateReportRequest(
        @NotBlank
        @Size(max = 2000)
        String reason
) {
}
