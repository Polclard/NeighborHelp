package com.neighborhelp.config;

import com.neighborhelp.model.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private final JwtProperties jwtProperties;

    public JwtService(JwtProperties jwtProperties){
        this.jwtProperties = jwtProperties;
    }

    public String generateAccessToken(UUID userId, String email, Role role){
        Instant now = Instant.now();
        Instant expiresAt = now.plus(Duration.ofMinutes(jwtProperties.getAccessTokenExpirationMinutes()));

        return Jwts.builder()
            .subject(email)
            .claim("userId", userId.toString())
            .claim("role", role.name())
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiresAt))
            .signWith(signingKey())
            .compact();
    }

    public String extractMail(String token){
        return extractClaims(token).getSubject();
    }

    public UUID extractUserId(String token){
        return UUID.fromString  (extractClaims(token).get("userId", String.class));
    }

    public Role extractRole(String token) {
        return Role.valueOf(extractClaims(token).get("role", String.class));
    }

    public boolean isTokenExpired(String token){
        return extractClaims(token).getExpiration().before(new Date());
    }

    public boolean isTokenValid(String token, String expectedEmail){
        return expectedEmail.equals(extractMail(token)) && !isTokenExpired(token);
    }

    public long getAccessTokenExpirationSeconds(){
        return Duration.ofMinutes(jwtProperties.getAccessTokenExpirationMinutes()).getSeconds();
    }

    private Claims extractClaims(String token){
        return Jwts.parser()
                .verifyWith(signingKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey signingKey(){
        return Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
    }

}
