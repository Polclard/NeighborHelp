package com.neighborhelp.service;

import com.neighborhelp.dto.post.CreateServicePostRequest;
import com.neighborhelp.dto.post.ServicePostDetailResponse;
import com.neighborhelp.dto.post.ServicePostSummaryResponse;
import com.neighborhelp.dto.post.UpdateServicePostRequest;

import java.util.List;
import java.util.UUID;

public interface ServicePostService {

    ServicePostDetailResponse createPost(UUID userId, CreateServicePostRequest request);

    ServicePostDetailResponse updatePost(UUID userId, UUID postId, UpdateServicePostRequest request);

    void deletePost(UUID userId, UUID postId);

    List<ServicePostSummaryResponse> getPublicPosts();

    List<ServicePostSummaryResponse> getOwnPosts(UUID userId);

    ServicePostDetailResponse getPostById(UUID postId);
}