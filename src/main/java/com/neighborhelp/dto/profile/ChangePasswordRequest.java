package com.neighborhelp.dto.profile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank(message = "Current password is required")
        String currentPassword,

        @NotBlank(message = "New password is required")
        @Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters")
        String newPassword,

        @NotBlank(message = "Confirm password is required")
        @Size(min = 8, max = 72, message = "Confirm password must be between 8 and 72 characters")
        String confirmPassword
) {
}
