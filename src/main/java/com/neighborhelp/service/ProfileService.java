package com.neighborhelp.service;

import com.neighborhelp.dto.profile.ChangePasswordRequest;
import com.neighborhelp.dto.profile.OwnProfileResponse;
import com.neighborhelp.dto.profile.PublicProfileResponse;
import com.neighborhelp.dto.profile.UpdateProfileRequest;
import com.neighborhelp.dto.profile.UserReviewResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface ProfileService {

    OwnProfileResponse getOwnProfile(UUID userId);

    OwnProfileResponse updateOwnProfile(UUID userId, UpdateProfileRequest request);

    void changePassword(UUID userId, ChangePasswordRequest request);

    PublicProfileResponse getPublicProfile(UUID userId);

    OwnProfileResponse uploadAvatar(UUID userId, MultipartFile file);

    List<UserReviewResponse> getUserReviews(UUID userId);
}
