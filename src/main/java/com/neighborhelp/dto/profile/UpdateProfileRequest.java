package com.neighborhelp.dto.profile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank(message = "First name is required")
        @Size(max = 100, message = "First name must be at most 100 characters")
        String firstName,

        @NotBlank(message = "Last name is required")
        @Size(max = 100, message = "Last name must be at most 100 characters")
        String lastName,

        @Pattern(regexp = "^[0-9+()\\-\\s]{0,50}$", message = "Phone number contains invalid characters")
        String phoneNumber,

        @Size(max = 1000, message = "Bio must be at most 1000 characters")
        String bio
) {
}
