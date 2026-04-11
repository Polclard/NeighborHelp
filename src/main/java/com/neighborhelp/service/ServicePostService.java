package com.neighborhelp.service;

import com.neighborhelp.dto.post.CreateServicePostRequest;
import com.neighborhelp.dto.post.PostMarkerResponse;
import com.neighborhelp.dto.post.ServicePostDetailResponse;
import com.neighborhelp.dto.post.ServicePostSummaryResponse;
import com.neighborhelp.dto.post.UpdatePostStatusRequest;
import com.neighborhelp.dto.post.UpdateServicePostRequest;
import com.neighborhelp.model.PostStatus;
import com.neighborhelp.model.PostType;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface ServicePostService {

    ServicePostDetailResponse createPost(UUID userId, CreateServicePostRequest request);

    ServicePostDetailResponse updatePost(UUID userId, UUID postId, UpdateServicePostRequest request);

    void deletePost(UUID userId, UUID postId);

    ServicePostDetailResponse uploadPostPhoto(UUID userId, UUID postId, MultipartFile file);

    void deletePostPhoto(UUID userId, UUID postId, UUID photoId);

    ServicePostDetailResponse acceptRequest(UUID helperUserId, UUID postId);

    ServicePostDetailResponse updatePostStatus(UUID userId, UUID postId, UpdatePostStatusRequest request);

    List<ServicePostSummaryResponse> getPublicPosts(
            PostType postType,
            PostStatus status,
            String category,
            BigDecimal latitude,
            BigDecimal longitude,
            Double radiusKm
    );

    List<ServicePostSummaryResponse> searchPublicPosts(
            String keyword,
            PostType postType,
            PostStatus status,
            String category,
            BigDecimal latitude,
            BigDecimal longitude,
            Double radiusKm
    );

    List<PostMarkerResponse> getPostMarkers(
            String keyword,
            PostType postType,
            PostStatus status,
            String category,
            BigDecimal latitude,
            BigDecimal longitude,
            Double radiusKm
    );

    List<ServicePostSummaryResponse> getOwnPosts(UUID userId);

    ServicePostDetailResponse getPostById(UUID postId);
}