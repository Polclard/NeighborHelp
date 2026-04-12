package com.neighborhelp.service.impl;

import com.neighborhelp.dto.review.CreateReviewRequest;
import com.neighborhelp.dto.review.ReviewResponse;
import com.neighborhelp.exception.ConflictException;
import com.neighborhelp.exception.ForbiddenException;
import com.neighborhelp.model.PostStatus;
import com.neighborhelp.model.PostType;
import com.neighborhelp.model.Review;
import com.neighborhelp.model.ServicePost;
import com.neighborhelp.model.User;
import com.neighborhelp.repository.ReviewRepository;
import com.neighborhelp.repository.ServicePostRepository;
import com.neighborhelp.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReviewServiceImplTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private ServicePostRepository servicePostRepository;

    @Mock
    private UserRepository userRepository;

    private ReviewServiceImpl reviewService;

    @BeforeEach
    void setUp() {
        reviewService = new ReviewServiceImpl(reviewRepository, servicePostRepository, userRepository);
    }

    @Test
    void createReviewRecalculatesAverageRatingAndNormalizesComment() {
        UUID requesterId = UUID.randomUUID();
        UUID helperId = UUID.randomUUID();
        UUID postId = UUID.randomUUID();
        UUID reviewId = UUID.randomUUID();

        User requester = new User();
        requester.setId(requesterId);

        User helper = new User();
        helper.setId(helperId);
        helper.setAverageRating(new BigDecimal("0.00"));
        helper.setReviewCount(0);

        ServicePost completedRequest = new ServicePost();
        completedRequest.setId(postId);
        completedRequest.setUserId(requesterId);
        completedRequest.setAcceptedUserId(helperId);
        completedRequest.setPostType(PostType.SERVICE_REQUEST);
        completedRequest.setStatus(PostStatus.SERVICE_DONE);

        Review existingReview = new Review();
        existingReview.setRating(3);
        AtomicReference<Review> savedReviewReference = new AtomicReference<>();

        when(userRepository.findByIdAndDeletedAtIsNull(requesterId)).thenReturn(Optional.of(requester));
        when(userRepository.findByIdAndDeletedAtIsNull(helperId)).thenReturn(Optional.of(helper));
        when(servicePostRepository.findByIdAndDeletedAtIsNull(postId)).thenReturn(Optional.of(completedRequest));
        when(reviewRepository.findByPostIdAndReviewerIdAndDeletedAtIsNull(postId, requesterId)).thenReturn(Optional.empty());
        when(reviewRepository.save(any(Review.class))).thenAnswer(invocation -> {
            Review review = invocation.getArgument(0);
            review.setId(reviewId);
            review.setCreatedAt(OffsetDateTime.now());
            savedReviewReference.set(review);
            return review;
        });
        when(reviewRepository.findAllByReviewedUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(helperId))
                .thenAnswer(invocation -> List.of(savedReviewReference.get(), existingReview));

        ReviewResponse response = reviewService.createReview(
                requesterId,
                postId,
                new CreateReviewRequest(5, " Excellent help ")
        );

        ArgumentCaptor<Review> savedReviewCaptor = ArgumentCaptor.forClass(Review.class);
        verify(reviewRepository).save(savedReviewCaptor.capture());
        Review savedReview = savedReviewCaptor.getValue();

        assertThat(savedReview.getComment()).isEqualTo("Excellent help");
        assertThat(savedReview.getRating()).isEqualTo(5);
        assertThat(savedReview.getReviewedUserId()).isEqualTo(helperId);

        assertThat(helper.getReviewCount()).isEqualTo(2);
        assertThat(helper.getAverageRating()).isEqualByComparingTo("4.00");

        assertThat(response.id()).isEqualTo(reviewId);
        assertThat(response.reviewedUserId()).isEqualTo(helperId);
        assertThat(response.comment()).isEqualTo("Excellent help");
    }

    @Test
    void createReviewRejectsUsersWhoAreNotTheRequester() {
        UUID helperId = UUID.randomUUID();
        UUID requesterId = UUID.randomUUID();
        UUID postId = UUID.randomUUID();

        User helper = new User();
        helper.setId(helperId);

        ServicePost completedRequest = new ServicePost();
        completedRequest.setId(postId);
        completedRequest.setUserId(requesterId);
        completedRequest.setAcceptedUserId(helperId);
        completedRequest.setPostType(PostType.SERVICE_REQUEST);
        completedRequest.setStatus(PostStatus.SERVICE_DONE);

        when(userRepository.findByIdAndDeletedAtIsNull(helperId)).thenReturn(Optional.of(helper));
        when(servicePostRepository.findByIdAndDeletedAtIsNull(postId)).thenReturn(Optional.of(completedRequest));

        assertThatThrownBy(() -> reviewService.createReview(
                helperId,
                postId,
                new CreateReviewRequest(4, "Should fail")
        ))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Only the requester can leave a review");
    }

    @Test
    void createReviewRejectsDuplicateReviews() {
        UUID requesterId = UUID.randomUUID();
        UUID helperId = UUID.randomUUID();
        UUID postId = UUID.randomUUID();

        User requester = new User();
        requester.setId(requesterId);

        ServicePost completedRequest = new ServicePost();
        completedRequest.setId(postId);
        completedRequest.setUserId(requesterId);
        completedRequest.setAcceptedUserId(helperId);
        completedRequest.setPostType(PostType.SERVICE_REQUEST);
        completedRequest.setStatus(PostStatus.SERVICE_DONE);

        Review existingReview = new Review();
        existingReview.setId(UUID.randomUUID());

        when(userRepository.findByIdAndDeletedAtIsNull(requesterId)).thenReturn(Optional.of(requester));
        when(servicePostRepository.findByIdAndDeletedAtIsNull(postId)).thenReturn(Optional.of(completedRequest));
        when(reviewRepository.findByPostIdAndReviewerIdAndDeletedAtIsNull(postId, requesterId))
                .thenReturn(Optional.of(existingReview));

        assertThatThrownBy(() -> reviewService.createReview(
                requesterId,
                postId,
                new CreateReviewRequest(5, "Duplicate")
        ))
                .isInstanceOf(ConflictException.class)
                .hasMessage("You have already reviewed this completed service");
    }
}
