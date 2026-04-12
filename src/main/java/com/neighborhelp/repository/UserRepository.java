package com.neighborhelp.repository;

import com.neighborhelp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByIdAndDeletedAtIsNull(UUID id);

    Optional<User> findByEmailIgnoreCaseAndDeletedAtIsNull(String email);

    boolean existsByEmailIgnoreCase(String email);

    List<User> findAllByDeletedAtIsNullOrderByCreatedAtDesc();

    long countByDeletedAtIsNull();

    long countByIsBannedTrueAndDeletedAtIsNull();
}
