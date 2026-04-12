package com.neighborhelp.controller;

import com.neighborhelp.config.JwtProperties;
import com.neighborhelp.dto.auth.AuthResponse;
import com.neighborhelp.dto.auth.AuthTokens;
import com.neighborhelp.dto.auth.AuthUserResponse;
import com.neighborhelp.dto.auth.LoginRequest;
import com.neighborhelp.dto.auth.LogoutResponse;
import com.neighborhelp.dto.auth.RegisterRequest;
import com.neighborhelp.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final String REFRESH_TOKEN_COOKIE = "neighborhelp_refresh_token";

    private final AuthService authService;
    private final JwtProperties jwtProperties;

    public AuthController(AuthService authService, JwtProperties jwtProperties) {
        this.authService = authService;
        this.jwtProperties = jwtProperties;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletResponse response
    ) {
        AuthTokens tokens = authService.register(request);
        addRefreshTokenCookie(response, tokens.refreshToken());

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(toResponse(tokens));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response
    ) {
        AuthTokens tokens = authService.login(request);
        addRefreshTokenCookie(response, tokens.refreshToken());

        return ResponseEntity.ok(toResponse(tokens));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @CookieValue(name = REFRESH_TOKEN_COOKIE, required = false) String refreshToken,
            HttpServletResponse response
    ) {
        AuthTokens tokens = authService.refresh(refreshToken);
        addRefreshTokenCookie(response, tokens.refreshToken());

        return ResponseEntity.ok(toResponse(tokens));
    }

    @PostMapping("/logout")
    public ResponseEntity<LogoutResponse> logout(
            @CookieValue(name = REFRESH_TOKEN_COOKIE, required = false) String refreshToken,
            HttpServletResponse response
    ) {
        authService.logout(refreshToken);
        clearRefreshTokenCookie(response);

        return ResponseEntity.ok(new LogoutResponse("Logged out successfully"));
    }

    private AuthResponse toResponse(AuthTokens tokens) {
        return new AuthResponse(
                tokens.accessToken(),
                "Bearer",
                tokens.expiresIn(),
                new AuthUserResponse(
                        tokens.userId(),
                        tokens.firstName(),
                        tokens.lastName(),
                        tokens.email(),
                        tokens.role()
                )
        );
    }

    private void addRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_TOKEN_COOKIE, refreshToken)
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/api/auth")
                .maxAge(Duration.ofDays(jwtProperties.getRefreshTokenExpirationDays()))
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearRefreshTokenCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_TOKEN_COOKIE, "")
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/api/auth")
                .maxAge(Duration.ZERO)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
