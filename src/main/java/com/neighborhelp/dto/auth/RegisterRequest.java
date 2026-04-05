package com.neighborhelp.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank
    @Size(max = 100)
    String firstName,

    @NotBlank
    @Size(max = 100)
    String lastName,

    @NotBlank
    @Email
    @Size(max = 255)
    String email,

    @NotBlank
    @Size(min = 8, max = 72)
    String password,

    @NotBlank
    @Size(min = 8, max = 72)
    String confirmPassword,

    @Pattern(regexp = "^[0-9+()\\-\\s]{0,50}$", message = "Phone number contains invalid characters")
    String phoneNumber
){}
