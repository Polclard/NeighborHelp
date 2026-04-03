package com.neighborhelp.repository;

import com.neighborhelp.model.ServicePost;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ServicePostRepository extends JpaRepository<ServicePost, UUID> {
    List<ServicePost> findAllByDeletedAtIsNull();
    List<ServicePost>findAllByUserIdAndDeletedAtIsNull(UUID userId);
}
