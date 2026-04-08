package com.neighborhelp.service;

import com.neighborhelp.dto.review.CreateReviewRequest;
import com.neighborhelp.dto.review.ReviewResponse;

import java.util.UUID;

public interface ReviewService {

    ReviewResponse createReview(UUID reviewerId, UUID postId, CreateReviewRequest request);
}
