package com.neighborhelp.controller;

import com.neighborhelp.dto.profile.OwnProfileResponse;
import com.neighborhelp.dto.profile.PublicProfileResponse;
import com.neighborhelp.dto.profile.UpdateProfileRequest;
import com.neighborhelp.dto.profile.UserReviewResponse;
import com.neighborhelp.security.AuthenticatedUser;
import com.neighborhelp.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@Profile("!test")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping("/api/users/me")
    public OwnProfileResponse getOwnProfile(Authentication authentication) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return profileService.getOwnProfile(user.getId());
    }

    @PutMapping("/api/users/me")
    public OwnProfileResponse updateOwnProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return profileService.updateOwnProfile(user.getId(), request);
    }

    @PostMapping(value = "/api/users/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public OwnProfileResponse uploadAvatar(
            Authentication authentication,
            @RequestParam("file") MultipartFile file
    ) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return profileService.uploadAvatar(user.getId(), file);
    }

    @GetMapping("/api/profiles/{userId}")
    public PublicProfileResponse getPublicProfile(@PathVariable UUID userId) {
        return profileService.getPublicProfile(userId);
    }

    @GetMapping("/api/profiles/{userId}/reviews")
    public List<UserReviewResponse> getUserReviews(@PathVariable UUID userId) {
        return profileService.getUserReviews(userId);
    }
}
