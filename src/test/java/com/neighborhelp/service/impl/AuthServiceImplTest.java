package com.neighborhelp.service.impl;

import com.neighborhelp.config.JwtProperties;
import com.neighborhelp.dto.auth.AuthTokens;
import com.neighborhelp.dto.auth.LoginRequest;
import com.neighborhelp.dto.auth.RegisterRequest;
import com.neighborhelp.exception.ForbiddenException;
import com.neighborhelp.model.RefreshToken;
import com.neighborhelp.model.Role;
import com.neighborhelp.model.User;
import com.neighborhelp.repository.RefreshTokenRepository;
import com.neighborhelp.repository.UserRepository;
import com.neighborhelp.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private JwtProperties jwtProperties;

    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        authService = new AuthServiceImpl(
                userRepository,
                refreshTokenRepository,
                passwordEncoder,
                jwtService,
                jwtProperties
        );
    }

    @Test
    void registerNormalizesUserDataAndIssuesTokens() {
        UUID userId = UUID.randomUUID();

        RegisterRequest request = new RegisterRequest(
                " Test ",
                " User ",
                "TEST@EXAMPLE.COM",
                "Password123!",
                "Password123!",
                " +38970114040 "
        );

        when(userRepository.existsByEmailIgnoreCase("test@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Password123!")).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(userId);
            return user;
        });
        when(refreshTokenRepository.findAllByUserIdAndRevokedAtIsNull(userId)).thenReturn(List.of());
        when(jwtService.generateAccessToken(userId, "test@example.com", Role.ROLE_USER)).thenReturn("access-token");
        when(jwtService.getAccessTokenExpirationSeconds()).thenReturn(900L);
        when(jwtProperties.getRefreshTokenExpirationDays()).thenReturn(7L);

        AuthTokens tokens = authService.register(request);

        ArgumentCaptor<User> savedUserCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(savedUserCaptor.capture());

        User savedUser = savedUserCaptor.getValue();
        assertThat(savedUser.getFirstName()).isEqualTo("Test");
        assertThat(savedUser.getLastName()).isEqualTo("User");
        assertThat(savedUser.getEmail()).isEqualTo("test@example.com");
        assertThat(savedUser.getPasswordHash()).isEqualTo("encoded-password");
        assertThat(savedUser.getPhoneNumber()).isEqualTo("+38970114040");
        assertThat(savedUser.getRole()).isEqualTo(Role.ROLE_USER);
        assertThat(savedUser.getIsBanned()).isFalse();

        ArgumentCaptor<RefreshToken> refreshTokenCaptor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).save(refreshTokenCaptor.capture());
        assertThat(refreshTokenCaptor.getValue().getUserId()).isEqualTo(userId);
        assertThat(refreshTokenCaptor.getValue().getToken()).isNotBlank();

        assertThat(tokens.accessToken()).isEqualTo("access-token");
        assertThat(tokens.expiresIn()).isEqualTo(900L);
        assertThat(tokens.email()).isEqualTo("test@example.com");
        assertThat(tokens.userId()).isEqualTo(userId);
        assertThat(tokens.role()).isEqualTo(Role.ROLE_USER);
    }

    @Test
    void loginRejectsBannedUsers() {
        User bannedUser = new User();
        bannedUser.setId(UUID.randomUUID());
        bannedUser.setEmail("banned@example.com");
        bannedUser.setPasswordHash("encoded-password");
        bannedUser.setRole(Role.ROLE_USER);
        bannedUser.setIsBanned(true);

        when(userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull("banned@example.com"))
                .thenReturn(Optional.of(bannedUser));

        assertThatThrownBy(() -> authService.login(new LoginRequest("banned@example.com", "Password123!")))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Your account has been banned");

        verify(userRepository).findByEmailIgnoreCaseAndDeletedAtIsNull(eq("banned@example.com"));
    }
}
