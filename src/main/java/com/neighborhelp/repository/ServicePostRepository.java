package com.neighborhelp.repository;

import com.neighborhelp.model.ServicePost;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ServicePostRepository extends JpaRepository<ServicePost, UUID> {

    Optional<ServicePost> findByIdAndDeletedAtIsNull(UUID id);

    List<ServicePost> findAllByDeletedAtIsNullOrderByCreatedAtDesc();

    List<ServicePost> findAllByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID userId);
}