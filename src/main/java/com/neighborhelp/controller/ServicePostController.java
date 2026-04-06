package com.neighborhelp.controller;

import com.neighborhelp.dto.post.CreateServicePostRequest;
import com.neighborhelp.dto.post.ServicePostDetailResponse;
import com.neighborhelp.dto.post.ServicePostSummaryResponse;
import com.neighborhelp.dto.post.UpdateServicePostRequest;
import com.neighborhelp.security.AuthenticatedUser;
import com.neighborhelp.service.ServicePostService;
import jakarta.validation.Valid;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@Profile("!test")
public class ServicePostController {

    private final ServicePostService servicePostService;

    public ServicePostController(ServicePostService servicePostService) {
        this.servicePostService = servicePostService;
    }

    @PostMapping("/api/posts")
    public ServicePostDetailResponse createPost(
            Authentication authentication,
            @Valid @RequestBody CreateServicePostRequest request
    ) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return servicePostService.createPost(user.getId(), request);
    }

    @PutMapping("/api/posts/{postId}")
    public ServicePostDetailResponse updatePost(
            Authentication authentication,
            @PathVariable UUID postId,
            @Valid @RequestBody UpdateServicePostRequest request
    ) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return servicePostService.updatePost(user.getId(), postId, request);
    }

    @DeleteMapping("/api/posts/{postId}")
    public ResponseEntity<Void> deletePost(
            Authentication authentication,
            @PathVariable UUID postId
    ) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        servicePostService.deletePost(user.getId(), postId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/posts")
    public List<ServicePostSummaryResponse> getPublicPosts() {
        return servicePostService.getPublicPosts();
    }

    @GetMapping("/api/posts/{postId}")
    public ServicePostDetailResponse getPostById(@PathVariable UUID postId) {
        return servicePostService.getPostById(postId);
    }

    @GetMapping("/api/users/me/posts")
    public List<ServicePostSummaryResponse> getOwnPosts(Authentication authentication) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return servicePostService.getOwnPosts(user.getId());
    }
}