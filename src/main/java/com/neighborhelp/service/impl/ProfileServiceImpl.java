package com.neighborhelp.service.impl;

import com.neighborhelp.dto.profile.ChangePasswordRequest;
import com.neighborhelp.dto.profile.OwnProfileResponse;
import com.neighborhelp.dto.profile.PublicProfileResponse;
import com.neighborhelp.dto.profile.UpdateProfileRequest;
import com.neighborhelp.dto.profile.UserReviewResponse;
import com.neighborhelp.exception.NotFoundException;
import com.neighborhelp.model.RefreshToken;
import com.neighborhelp.model.Review;
import com.neighborhelp.model.User;
import com.neighborhelp.repository.RefreshTokenRepository;
import com.neighborhelp.repository.ReviewRepository;
import com.neighborhelp.repository.UserRepository;
import com.neighborhelp.service.FileStorageService;
import com.neighborhelp.service.ProfileService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional
public class ProfileServiceImpl implements ProfileService {

    private static final long MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
    private static final Logger log = LoggerFactory.getLogger(ProfileServiceImpl.class);

    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final FileStorageService fileStorageService;
    private final PasswordEncoder passwordEncoder;

    public ProfileServiceImpl(
            UserRepository userRepository,
            ReviewRepository reviewRepository,
            RefreshTokenRepository refreshTokenRepository,
            FileStorageService fileStorageService,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.reviewRepository = reviewRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.fileStorageService = fileStorageService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional(readOnly = true)
    public OwnProfileResponse getOwnProfile(UUID userId) {
        User user = getActiveUser(userId);
        return toOwnProfileResponse(user);
    }

    @Override
    public OwnProfileResponse updateOwnProfile(UUID userId, UpdateProfileRequest request) {
        User user = getActiveUser(userId);
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setPhoneNumber(normalizeNullable(request.phoneNumber()));
        user.setBio(normalizeNullable(request.bio()));
        return toOwnProfileResponse(user);
    }

    @Override
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = getActiveUser(userId);

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }

        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("New password must be different from the current password");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        revokeActiveRefreshTokens(userId);
    }

    @Override
    public OwnProfileResponse uploadAvatar(UUID userId, MultipartFile file) {
        User user = getActiveUser(userId);
        validateAvatar(file);

        String previousAvatar = user.getProfilePicture();
        user.setProfilePicture(fileStorageService.storeProfileAvatar(userId, file));
        deleteStoredFileQuietly(previousAvatar);

        return toOwnProfileResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public PublicProfileResponse getPublicProfile(UUID userId) {
        User user = getActiveUser(userId);
        return new PublicProfileResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getBio(),
                user.getProfilePicture(),
                user.getAverageRating(),
                user.getReviewCount()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserReviewResponse> getUserReviews(UUID userId) {
        getActiveUser(userId);

        List<Review> reviews = reviewRepository.findAllByReviewedUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId);
        Map<UUID, User> reviewers = new HashMap<>();

        for (Review review : reviews) {
            userRepository.findByIdAndDeletedAtIsNull(review.getReviewerId())
                    .ifPresent(user -> reviewers.put(review.getReviewerId(), user));
        }

        return reviews.stream()
                .map(review -> {
                    User reviewer = reviewers.get(review.getReviewerId());

                    return new UserReviewResponse(
                            review.getId(),
                            review.getPostId(),
                            review.getReviewerId(),
                            reviewer != null ? reviewer.getFirstName() : "Unknown",
                            reviewer != null ? reviewer.getLastName() : "User",
                            review.getRating(),
                            review.getComment(),
                            review.getCreatedAt()
                    );
                })
                .toList();
    }

    private void revokeActiveRefreshTokens(UUID userId) {
        OffsetDateTime now = OffsetDateTime.now();

        for (RefreshToken token : refreshTokenRepository.findAllByUserIdAndRevokedAtIsNull(userId)) {
            token.setRevokedAt(now);
        }
    }

    private User getActiveUser(UUID userId) {
        return userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private OwnProfileResponse toOwnProfileResponse(User user) {
        return new OwnProfileResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getBio(),
                user.getProfilePicture(),
                user.getRole(),
                user.getAverageRating(),
                user.getReviewCount()
        );
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void validateAvatar(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Avatar file is required");
        }

        if (file.getSize() > MAX_AVATAR_SIZE_BYTES) {
            throw new IllegalArgumentException("Avatar file must be 5 MB or smaller");
        }

        String contentType = file.getContentType();
        if (contentType == null) {
            throw new IllegalArgumentException("Avatar file type is missing");
        }

        String normalizedContentType = contentType.toLowerCase(Locale.ROOT);
        if (!normalizedContentType.equals("image/jpeg")
                && !normalizedContentType.equals("image/png")
                && !normalizedContentType.equals("image/webp")) {
            throw new IllegalArgumentException("Avatar must be a JPG, PNG, or WEBP image");
        }
    }

    private void deleteStoredFileQuietly(String storedPath) {
        if (storedPath == null || storedPath.isBlank()) {
            return;
        }

        try {
            fileStorageService.deleteStoredFile(storedPath);
        } catch (RuntimeException exception) {
            log.warn("Failed to delete stored avatar {}", storedPath, exception);
        }
    }
}
