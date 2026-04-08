package com.neighborhelp.service.impl;

import com.neighborhelp.dto.review.CreateReviewRequest;
import com.neighborhelp.dto.review.ReviewResponse;
import com.neighborhelp.exception.ConflictException;
import com.neighborhelp.exception.ForbiddenException;
import com.neighborhelp.exception.NotFoundException;
import com.neighborhelp.model.PostStatus;
import com.neighborhelp.model.PostType;
import com.neighborhelp.model.Review;
import com.neighborhelp.model.ServicePost;
import com.neighborhelp.model.User;
import com.neighborhelp.repository.ReviewRepository;
import com.neighborhelp.repository.ServicePostRepository;
import com.neighborhelp.repository.UserRepository;
import com.neighborhelp.service.ReviewService;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
@Profile("!test")
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ServicePostRepository servicePostRepository;
    private final UserRepository userRepository;

    public ReviewServiceImpl(
            ReviewRepository reviewRepository,
            ServicePostRepository servicePostRepository,
            UserRepository userRepository
    ) {
        this.reviewRepository = reviewRepository;
        this.servicePostRepository = servicePostRepository;
        this.userRepository = userRepository;
    }

    @Override
    public ReviewResponse createReview(UUID reviewerId, UUID postId, CreateReviewRequest request) {
        User reviewer = getActiveUser(reviewerId);

        ServicePost post = servicePostRepository.findByIdAndDeletedAtIsNull(postId)
                .orElseThrow(() -> new NotFoundException("Post not found"));

        validateReviewablePost(post, reviewer);

        if (reviewRepository.findByPostIdAndReviewerIdAndDeletedAtIsNull(postId, reviewerId).isPresent()) {
            throw new ConflictException("You have already reviewed this completed service");
        }

        User reviewedUser = getActiveUser(post.getAcceptedUserId());

        Review review = new Review();
        review.setPostId(post.getId());
        review.setReviewerId(reviewer.getId());
        review.setReviewedUserId(reviewedUser.getId());
        review.setRating(request.rating());
        review.setComment(normalizeNullable(request.comment()));

        Review savedReview = reviewRepository.save(review);
        recalculateUserRating(reviewedUser);

        return new ReviewResponse(
                savedReview.getId(),
                savedReview.getPostId(),
                savedReview.getReviewerId(),
                savedReview.getReviewedUserId(),
                savedReview.getRating(),
                savedReview.getComment(),
                savedReview.getCreatedAt()
        );
    }

    private void validateReviewablePost(ServicePost post, User reviewer) {
        if (post.getPostType() != PostType.SERVICE_REQUEST) {
            throw new ConflictException("Only completed service requests can be reviewed");
        }

        if (!post.getUserId().equals(reviewer.getId())) {
            throw new ForbiddenException("Only the requester can leave a review");
        }

        if (post.getStatus() != PostStatus.SERVICE_DONE) {
            throw new ConflictException("You can only review after the service is marked done");
        }

        if (post.getAcceptedUserId() == null) {
            throw new ConflictException("This request has no accepted helper to review");
        }

        if (post.getAcceptedUserId().equals(reviewer.getId())) {
            throw new ConflictException("You cannot review yourself");
        }
    }

    private void recalculateUserRating(User reviewedUser) {
        List<Review> reviews = reviewRepository.findAllByReviewedUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(
                reviewedUser.getId()
        );

        int reviewCount = reviews.size();
        reviewedUser.setReviewCount(reviewCount);

        if (reviewCount == 0) {
            reviewedUser.setAverageRating(new BigDecimal("0.00"));
            return;
        }

        BigDecimal total = reviews.stream()
                .map(review -> BigDecimal.valueOf(review.getRating()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal average = total.divide(BigDecimal.valueOf(reviewCount), 2, RoundingMode.HALF_UP);
        reviewedUser.setAverageRating(average);
    }

    private User getActiveUser(UUID userId) {
        return userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}