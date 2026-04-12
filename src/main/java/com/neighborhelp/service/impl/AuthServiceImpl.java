package com.neighborhelp.service.impl;

import com.neighborhelp.config.JwtProperties;
import com.neighborhelp.dto.auth.AuthTokens;
import com.neighborhelp.dto.auth.LoginRequest;
import com.neighborhelp.dto.auth.RegisterRequest;
import com.neighborhelp.exception.ConflictException;
import com.neighborhelp.exception.ForbiddenException;
import com.neighborhelp.exception.UnauthorizedException;
import com.neighborhelp.model.RefreshToken;
import com.neighborhelp.model.Role;
import com.neighborhelp.model.User;
import com.neighborhelp.repository.RefreshTokenRepository;
import com.neighborhelp.repository.UserRepository;
import com.neighborhelp.security.JwtService;
import com.neighborhelp.service.AuthService;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.Locale;
import java.util.UUID;

@Service
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;

    public AuthServiceImpl(UserRepository userRepository, RefreshTokenRepository refreshTokenRepository, PasswordEncoder passwordEncoder, JwtService jwtService, JwtProperties jwtProperties) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.jwtProperties = jwtProperties;
    }

    @Override
    public AuthTokens register(RegisterRequest request) {
        if (!request.password().equals(request.confirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }

        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("Email is already registered");
        }

        User user = new User();
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setPhoneNumber(normalizeNullable(request.phoneNumber()));
        user.setRole(Role.ROLE_USER);
        user.setIsBanned(false);

        User savedUser = userRepository.save(user);
        return issueTokens(savedUser);
    }

    @Override
    public AuthTokens login(LoginRequest request) {
        String email = normalizeEmail(request.email());

        User user = userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(email)
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        validateActiveUser(user);

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        return issueTokens(user);
    }

    @Override
    public AuthTokens refresh(String refreshTokenValue) {
        if (refreshTokenValue == null || refreshTokenValue.isBlank()) {
            throw new UnauthorizedException("Refresh token is missing");
        }

        RefreshToken storedToken = refreshTokenRepository.findByTokenAndRevokedAtIsNull(refreshTokenValue)
                .orElseThrow(() -> new UnauthorizedException("Refresh token is invalid"));

        if (storedToken.getExpiresAt().isBefore(OffsetDateTime.now())) {
            storedToken.setRevokedAt(OffsetDateTime.now());
            throw new UnauthorizedException("Refresh token has expired");
        }

        User user = userRepository.findByIdAndDeletedAtIsNull(storedToken.getUserId())
                .orElseThrow(() -> new UnauthorizedException("User account is not available"));

        validateActiveUser(user);

        storedToken.setRevokedAt(OffsetDateTime.now());
        return issueTokens(user);
    }

    @Override
    public void logout(String refreshTokenValue) {
        if (refreshTokenValue == null || refreshTokenValue.isBlank()) {
            return;
        }

        refreshTokenRepository.findByTokenAndRevokedAtIsNull(refreshTokenValue)
                .ifPresent(token -> revokeActiveRefreshTokens(token.getUserId()));
    }

    private AuthTokens issueTokens(User user) {
        revokeActiveRefreshTokens(user.getId());

        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.getRole());
        String refreshTokenValue = UUID.randomUUID().toString();

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUserId(user.getId());
        refreshToken.setToken(refreshTokenValue);
        refreshToken.setExpiresAt(OffsetDateTime.now().plusDays(jwtProperties.getRefreshTokenExpirationDays()));

        refreshTokenRepository.save(refreshToken);

        return new AuthTokens(
                accessToken,
                refreshTokenValue,
                jwtService.getAccessTokenExpirationSeconds(),
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getRole()
        );
    }

    private void validateActiveUser(User user) {
        if (Boolean.TRUE.equals(user.getIsBanned())) {
            throw new ForbiddenException("Your account has been banned");
        }

        if (user.getDeletedAt() != null) {
            throw new UnauthorizedException("User account is not available");
        }
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void revokeActiveRefreshTokens(UUID userId) {
        OffsetDateTime now = OffsetDateTime.now();
        refreshTokenRepository.findAllByUserIdAndRevokedAtIsNull(userId)
                .forEach(token -> token.setRevokedAt(now));
    }

}
