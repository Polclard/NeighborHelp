package com.neighborhelp.controller;

import com.neighborhelp.dto.post.CreateServicePostRequest;
import com.neighborhelp.dto.post.PostMarkerResponse;
import com.neighborhelp.dto.post.ServicePostDetailResponse;
import com.neighborhelp.dto.post.ServicePostSummaryResponse;
import com.neighborhelp.dto.post.UpdatePostStatusRequest;
import com.neighborhelp.dto.post.UpdateServicePostRequest;
import com.neighborhelp.model.PostStatus;
import com.neighborhelp.model.PostType;
import com.neighborhelp.security.AuthenticatedUser;
import com.neighborhelp.service.ServicePostService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
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

    @PostMapping("/api/posts/{postId}/accept")
    public ServicePostDetailResponse acceptRequest(
            Authentication authentication,
            @PathVariable UUID postId
    ) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return servicePostService.acceptRequest(user.getId(), postId);
    }

    @PatchMapping("/api/posts/{postId}/status")
    public ServicePostDetailResponse updatePostStatus(
            Authentication authentication,
            @PathVariable UUID postId,
            @Valid @RequestBody UpdatePostStatusRequest request
    ) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return servicePostService.updatePostStatus(user.getId(), postId, request);
    }

    @DeleteMapping("/api/posts/{postId}")
    public ResponseEntity<Void> deletePost(Authentication authentication, @PathVariable UUID postId) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        servicePostService.deletePost(user.getId(), postId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/api/posts/{postId}/photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ServicePostDetailResponse uploadPostPhoto(
            Authentication authentication,
            @PathVariable UUID postId,
            @RequestParam("file") MultipartFile file
    ) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return servicePostService.uploadPostPhoto(user.getId(), postId, file);
    }

    @DeleteMapping("/api/posts/{postId}/photos/{photoId}")
    public ResponseEntity<Void> deletePostPhoto(
            Authentication authentication,
            @PathVariable UUID postId,
            @PathVariable UUID photoId
    ) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        servicePostService.deletePostPhoto(user.getId(), postId, photoId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/posts")
    public List<ServicePostSummaryResponse> getPublicPosts(
            @RequestParam(required = false) PostType postType,
            @RequestParam(required = false) PostStatus status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) BigDecimal latitude,
            @RequestParam(required = false) BigDecimal longitude,
            @RequestParam(required = false) Double radiusKm
    ) {
        return servicePostService.getPublicPosts(postType, status, category, latitude, longitude, radiusKm);
    }

    @GetMapping("/api/posts/search")
    public List<ServicePostSummaryResponse> searchPublicPosts(
            @RequestParam String keyword,
            @RequestParam(required = false) PostType postType,
            @RequestParam(required = false) PostStatus status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) BigDecimal latitude,
            @RequestParam(required = false) BigDecimal longitude,
            @RequestParam(required = false) Double radiusKm
    ) {
        return servicePostService.searchPublicPosts(
                keyword,
                postType,
                status,
                category,
                latitude,
                longitude,
                radiusKm
        );
    }

    @GetMapping("/api/posts/markers")
    public List<PostMarkerResponse> getPostMarkers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) PostType postType,
            @RequestParam(required = false) PostStatus status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) BigDecimal latitude,
            @RequestParam(required = false) BigDecimal longitude,
            @RequestParam(required = false) Double radiusKm
    ) {
        return servicePostService.getPostMarkers(
                keyword,
                postType,
                status,
                category,
                latitude,
                longitude,
                radiusKm
        );
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