package com.neighborhelp.service.impl;

import com.neighborhelp.dto.post.CreateServicePostRequest;
import com.neighborhelp.dto.post.ServicePostDetailResponse;
import com.neighborhelp.dto.post.ServicePostSummaryResponse;
import com.neighborhelp.dto.post.UpdateServicePostRequest;
import com.neighborhelp.exception.ConflictException;
import com.neighborhelp.exception.ForbiddenException;
import com.neighborhelp.exception.NotFoundException;
import com.neighborhelp.model.PostStatus;
import com.neighborhelp.model.PostType;
import com.neighborhelp.model.ServicePost;
import com.neighborhelp.model.User;
import com.neighborhelp.repository.ServicePostRepository;
import com.neighborhelp.repository.UserRepository;
import com.neighborhelp.service.ServicePostService;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@Transactional
@Profile("!test")
public class ServicePostServiceImpl implements ServicePostService {

    private final ServicePostRepository servicePostRepository;
    private final UserRepository userRepository;

    public ServicePostServiceImpl(
            ServicePostRepository servicePostRepository,
            UserRepository userRepository
    ) {
        this.servicePostRepository = servicePostRepository;
        this.userRepository = userRepository;
    }

    @Override
    public ServicePostDetailResponse createPost(UUID userId, CreateServicePostRequest request) {
        User user = getActiveUser(userId);

        ServicePost post = new ServicePost();
        post.setUserId(user.getId());
        post.setPostType(request.postType());
        post.setStatus(resolveInitialStatus(request.postType()));

        applyPostValues(
                post,
                request.title(),
                request.description(),
                request.category(),
                request.latitude(),
                request.longitude(),
                request.addressLabel(),
                request.contactPhone(),
                request.contactEmail(),
                user
        );

        ServicePost savedPost = servicePostRepository.save(post);
        return toDetailResponse(savedPost);
    }

    @Override
    public ServicePostDetailResponse updatePost(UUID userId, UUID postId, UpdateServicePostRequest request) {
        User user = getActiveUser(userId);
        ServicePost post = getOwnedEditablePost(userId, postId);

        applyPostValues(
                post,
                request.title(),
                request.description(),
                request.category(),
                request.latitude(),
                request.longitude(),
                request.addressLabel(),
                request.contactPhone(),
                request.contactEmail(),
                user
        );

        return toDetailResponse(post);
    }

    @Override
    public void deletePost(UUID userId, UUID postId) {
        ServicePost post = getOwnedEditablePost(userId, postId);
        post.setDeletedAt(OffsetDateTime.now());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServicePostSummaryResponse> getPublicPosts() {
        return servicePostRepository.findAllByDeletedAtIsNullOrderByCreatedAtDesc()
                .stream()
                .map(this::toSummaryResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServicePostSummaryResponse> getOwnPosts(UUID userId) {
        return servicePostRepository.findAllByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toSummaryResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ServicePostDetailResponse getPostById(UUID postId) {
        ServicePost post = servicePostRepository.findByIdAndDeletedAtIsNull(postId)
                .orElseThrow(() -> new NotFoundException("Post not found"));

        return toDetailResponse(post);
    }

    private User getActiveUser(UUID userId) {
        return userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private ServicePost getOwnedEditablePost(UUID userId, UUID postId) {
        ServicePost post = servicePostRepository.findByIdAndDeletedAtIsNull(postId)
                .orElseThrow(() -> new NotFoundException("Post not found"));

        if (!post.getUserId().equals(userId)) {
            throw new ForbiddenException("You can only modify your own posts");
        }

        validateEditableStatus(post);
        return post;
    }

    private void validateEditableStatus(ServicePost post) {
        if (post.getPostType() == PostType.SERVICE_REQUEST && post.getStatus() != PostStatus.REQUESTING) {
            throw new ConflictException("This request can no longer be modified");
        }

        if (post.getPostType() == PostType.SERVICE_OFFER
                && post.getStatus() != PostStatus.OFFERING
                && post.getStatus() != PostStatus.UNAVAILABLE) {
            throw new ConflictException("This offer can no longer be modified");
        }
    }

    private void applyPostValues(
            ServicePost post,
            String title,
            String description,
            String category,
            java.math.BigDecimal latitude,
            java.math.BigDecimal longitude,
            String addressLabel,
            String contactPhone,
            String contactEmail,
            User user
    ) {
        String normalizedPhone = normalizeNullable(contactPhone);
        String normalizedEmail = normalizeEmailOrNull(contactEmail);

        post.setTitle(title.trim());
        post.setDescription(description.trim());
        post.setCategory(category.trim());
        post.setLatitude(latitude);
        post.setLongitude(longitude);
        post.setAddressLabel(normalizeNullable(addressLabel));
        post.setContactPhone(normalizedPhone != null ? normalizedPhone : user.getPhoneNumber());
        post.setContactEmail(normalizedEmail != null ? normalizedEmail : user.getEmail());
    }

    private PostStatus resolveInitialStatus(PostType postType) {
        return postType == PostType.SERVICE_REQUEST
                ? PostStatus.REQUESTING
                : PostStatus.OFFERING;
    }

    private ServicePostSummaryResponse toSummaryResponse(ServicePost post) {
        return new ServicePostSummaryResponse(
                post.getId(),
                post.getUserId(),
                post.getTitle(),
                post.getDescription(),
                post.getPostType(),
                post.getStatus(),
                post.getCategory(),
                post.getLatitude(),
                post.getLongitude(),
                post.getAddressLabel(),
                post.getCreatedAt()
        );
    }

    private ServicePostDetailResponse toDetailResponse(ServicePost post) {
        return new ServicePostDetailResponse(
                post.getId(),
                post.getUserId(),
                post.getTitle(),
                post.getDescription(),
                post.getPostType(),
                post.getStatus(),
                post.getCategory(),
                post.getLatitude(),
                post.getLongitude(),
                post.getAddressLabel(),
                post.getContactPhone(),
                post.getContactEmail(),
                post.getAcceptedUserId(),
                post.getCreatedAt(),
                post.getUpdatedAt()
        );
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeEmailOrNull(String value) {
        String normalized = normalizeNullable(value);
        return normalized == null ? null : normalized.toLowerCase(Locale.ROOT);
    }
}