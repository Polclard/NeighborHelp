package com.neighborhelp.repository;

import com.neighborhelp.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReviewRepository extends JpaRepository<Review, UUID> {
    List<Review> findAllByReviewedUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID reviewedUserId);
    Optional<Review> findByPostIdAndReviewerIdAndDeletedAtIsNull(UUID postId, UUID reviewerId);
}