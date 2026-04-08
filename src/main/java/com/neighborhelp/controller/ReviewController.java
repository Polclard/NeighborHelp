package com.neighborhelp.controller;

import com.neighborhelp.dto.review.CreateReviewRequest;
import com.neighborhelp.dto.review.ReviewResponse;
import com.neighborhelp.security.AuthenticatedUser;
import com.neighborhelp.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@Profile("!test")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping("/api/posts/{postId}/reviews")
    public ResponseEntity<ReviewResponse> createReview(
            Authentication authentication,
            @PathVariable UUID postId,
            @Valid @RequestBody CreateReviewRequest request
    ) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(reviewService.createReview(user.getId(), postId, request));
    }
}
