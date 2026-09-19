package com.neighborhelp.service.impl;

import com.neighborhelp.dto.profile.ChangePasswordRequest;
import com.neighborhelp.exception.NotFoundException;
import com.neighborhelp.model.RefreshToken;
import com.neighborhelp.model.User;
import com.neighborhelp.repository.RefreshTokenRepository;
import com.neighborhelp.repository.ReviewRepository;
import com.neighborhelp.repository.UserRepository;
import com.neighborhelp.service.FileStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProfileServiceImplTest {

    private static final String CURRENT_PASSWORD = "Password123!";
    private static final String NEW_PASSWORD = "NewPassword456!";

    @Mock
    private UserRepository userRepository;

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private PasswordEncoder passwordEncoder;

    private ProfileServiceImpl profileService;

    private UUID userId;
    private User user;

    @BeforeEach
    void setUp() {
        profileService = new ProfileServiceImpl(
                userRepository,
                reviewRepository,
                refreshTokenRepository,
                fileStorageService,
                passwordEncoder
        );

        userId = UUID.randomUUID();
        user = new User();
        user.setId(userId);
        user.setPasswordHash("encoded-current-password");
    }

    @Test
    void changePasswordStoresNewHashAndRevokesRefreshTokens() {
        RefreshToken activeToken = new RefreshToken();
        activeToken.setUserId(userId);

        when(userRepository.findByIdAndDeletedAtIsNull(userId)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(CURRENT_PASSWORD, "encoded-current-password")).thenReturn(true);
        when(passwordEncoder.matches(NEW_PASSWORD, "encoded-current-password")).thenReturn(false);
        when(passwordEncoder.encode(NEW_PASSWORD)).thenReturn("encoded-new-password");
        when(refreshTokenRepository.findAllByUserIdAndRevokedAtIsNull(userId)).thenReturn(List.of(activeToken));

        profileService.changePassword(userId, new ChangePasswordRequest(CURRENT_PASSWORD, NEW_PASSWORD, NEW_PASSWORD));

        assertThat(user.getPasswordHash()).isEqualTo("encoded-new-password");
        assertThat(activeToken.getRevokedAt()).isNotNull();
    }

    @Test
    void changePasswordRejectsWrongCurrentPassword() {
        when(userRepository.findByIdAndDeletedAtIsNull(userId)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("WrongPassword123!", "encoded-current-password")).thenReturn(false);

        assertThatThrownBy(() -> profileService.changePassword(
                userId,
                new ChangePasswordRequest("WrongPassword123!", NEW_PASSWORD, NEW_PASSWORD)
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Current password is incorrect");

        assertThat(user.getPasswordHash()).isEqualTo("encoded-current-password");
        verify(refreshTokenRepository, never()).findAllByUserIdAndRevokedAtIsNull(userId);
    }

    @Test
    void changePasswordRejectsMismatchedConfirmation() {
        when(userRepository.findByIdAndDeletedAtIsNull(userId)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(CURRENT_PASSWORD, "encoded-current-password")).thenReturn(true);

        assertThatThrownBy(() -> profileService.changePassword(
                userId,
                new ChangePasswordRequest(CURRENT_PASSWORD, NEW_PASSWORD, "AnotherPassword789!")
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Passwords do not match");

        assertThat(user.getPasswordHash()).isEqualTo("encoded-current-password");
    }

    @Test
    void changePasswordRejectsReusingTheCurrentPassword() {
        when(userRepository.findByIdAndDeletedAtIsNull(userId)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(CURRENT_PASSWORD, "encoded-current-password")).thenReturn(true);

        assertThatThrownBy(() -> profileService.changePassword(
                userId,
                new ChangePasswordRequest(CURRENT_PASSWORD, CURRENT_PASSWORD, CURRENT_PASSWORD)
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("New password must be different from the current password");

        assertThat(user.getPasswordHash()).isEqualTo("encoded-current-password");
    }

    @Test
    void changePasswordRequiresAnActiveUser() {
        when(userRepository.findByIdAndDeletedAtIsNull(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> profileService.changePassword(
                userId,
                new ChangePasswordRequest(CURRENT_PASSWORD, NEW_PASSWORD, NEW_PASSWORD)
        ))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("User not found");
    }
}
