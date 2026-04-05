package com.neighborhelp.repository;

import com.neighborhelp.model.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByTokenAndRevokedAtIsNull(String token);

    List<RefreshToken> findAllByUserIdAndRevokedAtIsNull(UUID userId);
}