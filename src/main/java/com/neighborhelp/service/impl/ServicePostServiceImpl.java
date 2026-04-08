package com.neighborhelp.service.impl;

import com.neighborhelp.dto.post.CreateServicePostRequest;
import com.neighborhelp.dto.post.PostPhotoResponse;
import com.neighborhelp.dto.post.ServicePostDetailResponse;
import com.neighborhelp.dto.post.ServicePostSummaryResponse;
import com.neighborhelp.dto.post.UpdatePostStatusRequest;
import com.neighborhelp.dto.post.UpdateServicePostRequest;
import com.neighborhelp.exception.ConflictException;
import com.neighborhelp.exception.ForbiddenException;
import com.neighborhelp.exception.NotFoundException;
import com.neighborhelp.model.PostPhoto;
import com.neighborhelp.model.PostStatus;
import com.neighborhelp.model.PostType;
import com.neighborhelp.model.ServicePost;
import com.neighborhelp.model.User;
import com.neighborhelp.repository.PostPhotoRepository;
import com.neighborhelp.repository.ServicePostRepository;
import com.neighborhelp.repository.UserRepository;
import com.neighborhelp.service.FileStorageService;
import com.neighborhelp.service.ServicePostService;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@Transactional
@Profile("!test")
public class ServicePostServiceImpl implements ServicePostService {

    private static final int MAX_POST_PHOTOS = 5;
    private static final long MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

    private final ServicePostRepository servicePostRepository;
    private final UserRepository userRepository;
    private final PostPhotoRepository postPhotoRepository;
    private final FileStorageService fileStorageService;

    public ServicePostServiceImpl(
            ServicePostRepository servicePostRepository,
            UserRepository userRepository,
            PostPhotoRepository postPhotoRepository,
            FileStorageService fileStorageService
    ) {
        this.servicePostRepository = servicePostRepository;
        this.userRepository = userRepository;
        this.postPhotoRepository = postPhotoRepository;
        this.fileStorageService = fileStorageService;
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

        return toDetailResponse(servicePostRepository.save(post));
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
    public ServicePostDetailResponse uploadPostPhoto(UUID userId, UUID postId, MultipartFile file) {
        ServicePost post = getOwnedEditablePost(userId, postId);
        validatePostImage(file);

        List<PostPhoto> existingPhotos = postPhotoRepository.findAllByPostIdOrderByUploadedAtAsc(postId);
        if (existingPhotos.size() >= MAX_POST_PHOTOS) {
            throw new ConflictException("A post can have at most 5 photos");
        }

        PostPhoto postPhoto = new PostPhoto();
        postPhoto.setPostId(postId);
        postPhoto.setFilePath(fileStorageService.storePostPhoto(postId, file));
        postPhotoRepository.save(postPhoto);

        return toDetailResponse(post);
    }

    @Override
    public void deletePostPhoto(UUID userId, UUID postId, UUID photoId) {
        getOwnedEditablePost(userId, postId);

        PostPhoto postPhoto = postPhotoRepository.findByIdAndPostId(photoId, postId)
                .orElseThrow(() -> new NotFoundException("Post photo not found"));

        postPhotoRepository.delete(postPhoto);
    }

    @Override
    public ServicePostDetailResponse updatePostStatus(UUID userId, UUID postId, UpdatePostStatusRequest request) {
        ServicePost post = getOwnedPost(userId, postId);

        if (post.getStatus() == request.status()) {
            return toDetailResponse(post);
        }

        validateStatusTransition(post, request.status());
        post.setStatus(request.status());

        return toDetailResponse(post);
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

    @Override
    public ServicePostDetailResponse acceptRequest(UUID helperUserId, UUID postId) {
        User helper = getActiveUser(helperUserId);

        ServicePost post = servicePostRepository.findByIdAndDeletedAtIsNull(postId)
                .orElseThrow(() -> new NotFoundException("Post not found"));

        if (post.getPostType() != PostType.SERVICE_REQUEST) {
            throw new ConflictException("Only service requests can be accepted");
        }

        if (post.getUserId().equals(helper.getId())) {
            throw new ConflictException("You cannot accept your own request");
        }

        if (post.getStatus() != PostStatus.REQUESTING) {
            throw new ConflictException("This request is no longer open for acceptance");
        }

        if (post.getAcceptedUserId() != null) {
            throw new ConflictException("This request has already been accepted");
        }

        post.setAcceptedUserId(helper.getId());
        post.setStatus(PostStatus.SERVICE_ACCEPTED);

        return toDetailResponse(post);
    }

    private User getActiveUser(UUID userId) {
        return userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private ServicePost getOwnedPost(UUID userId, UUID postId) {
        ServicePost post = servicePostRepository.findByIdAndDeletedAtIsNull(postId)
                .orElseThrow(() -> new NotFoundException("Post not found"));

        if (!post.getUserId().equals(userId)) {
            throw new ForbiddenException("You can only modify your own posts");
        }

        return post;
    }

    private ServicePost getOwnedEditablePost(UUID userId, UUID postId) {
        ServicePost post = getOwnedPost(userId, postId);
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

    private void validateStatusTransition(ServicePost post, PostStatus nextStatus) {
        if (post.getPostType() == PostType.SERVICE_REQUEST) {
            validateRequestStatusTransition(post.getStatus(), nextStatus);
            return;
        }

        validateOfferStatusTransition(post.getStatus(), nextStatus);
    }

    private void validateRequestStatusTransition(PostStatus currentStatus, PostStatus nextStatus) {
        boolean allowed =
                (currentStatus == PostStatus.REQUESTING && nextStatus == PostStatus.CANCELLED)
                        || (currentStatus == PostStatus.SERVICE_ACCEPTED
                        && (nextStatus == PostStatus.SERVICE_DONE || nextStatus == PostStatus.CANCELLED));

        if (!allowed) {
            throw new ConflictException("Invalid status transition for service request");
        }
    }

    private void validateOfferStatusTransition(PostStatus currentStatus, PostStatus nextStatus) {
        boolean allowed =
                (currentStatus == PostStatus.OFFERING
                        && (nextStatus == PostStatus.UNAVAILABLE || nextStatus == PostStatus.CLOSED))
                        || (currentStatus == PostStatus.UNAVAILABLE
                        && (nextStatus == PostStatus.OFFERING || nextStatus == PostStatus.CLOSED));

        if (!allowed) {
            throw new ConflictException("Invalid status transition for service offer");
        }
    }

    private void validatePostImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Post photo is required");
        }

        if (file.getSize() > MAX_IMAGE_SIZE_BYTES) {
            throw new IllegalArgumentException("Post photo must be 5 MB or smaller");
        }

        String contentType = file.getContentType();
        if (contentType == null) {
            throw new IllegalArgumentException("Post photo type is missing");
        }

        String normalized = contentType.toLowerCase(Locale.ROOT);
        if (!normalized.equals("image/jpeg") && !normalized.equals("image/png") && !normalized.equals("image/webp")) {
            throw new IllegalArgumentException("Post photo must be a JPG, PNG, or WEBP image");
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
        List<PostPhotoResponse> photos = postPhotoRepository.findAllByPostIdOrderByUploadedAtAsc(post.getId())
                .stream()
                .map(photo -> new PostPhotoResponse(photo.getId(), photo.getFilePath(), photo.getUploadedAt()))
                .toList();

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
                post.getUpdatedAt(),
                photos
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