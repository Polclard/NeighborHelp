package com.neighborhelp.dto.profile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank
        @Size(max = 100)
        String firstName,

        @NotBlank
        @Size(max = 100)
        String lastName,

        @Pattern(regexp = "^[0-9+()\\-\\s]{0,50}$", message = "Phone number contains invalid characters")
        String phoneNumber,

        @Size(max = 1000)
        String bio
) {
}
