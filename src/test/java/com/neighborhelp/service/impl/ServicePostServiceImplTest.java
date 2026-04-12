package com.neighborhelp.service.impl;

import com.neighborhelp.dto.post.CreateServicePostRequest;
import com.neighborhelp.dto.post.ServicePostDetailResponse;
import com.neighborhelp.dto.post.UpdatePostStatusRequest;
import com.neighborhelp.exception.ConflictException;
import com.neighborhelp.model.PostStatus;
import com.neighborhelp.model.PostType;
import com.neighborhelp.model.ServicePost;
import com.neighborhelp.model.User;
import com.neighborhelp.repository.PostPhotoRepository;
import com.neighborhelp.repository.ServicePostRepository;
import com.neighborhelp.repository.UserRepository;
import com.neighborhelp.service.FileStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ServicePostServiceImplTest {

    @Mock
    private ServicePostRepository servicePostRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PostPhotoRepository postPhotoRepository;

    @Mock
    private FileStorageService fileStorageService;

    private ServicePostServiceImpl servicePostService;

    @BeforeEach
    void setUp() {
        servicePostService = new ServicePostServiceImpl(
                servicePostRepository,
                userRepository,
                postPhotoRepository,
                fileStorageService
        );
    }

    @Test
    void createPostSetsInitialStatusAndFallsBackToOwnerContactDetails() {
        UUID userId = UUID.randomUUID();
        UUID postId = UUID.randomUUID();

        User owner = new User();
        owner.setId(userId);
        owner.setEmail("owner@example.com");
        owner.setPhoneNumber("+38970114050");

        CreateServicePostRequest request = new CreateServicePostRequest(
                " Need plumbing help ",
                " Fix the leaking pipe ",
                PostType.SERVICE_REQUEST,
                " Plumbing ",
                new BigDecimal("41.9981"),
                new BigDecimal("21.4254"),
                " Centar ",
                null,
                null
        );

        when(userRepository.findByIdAndDeletedAtIsNull(userId)).thenReturn(Optional.of(owner));
        when(servicePostRepository.save(any(ServicePost.class))).thenAnswer(invocation -> {
            ServicePost post = invocation.getArgument(0);
            post.setId(postId);
            post.setCreatedAt(OffsetDateTime.now());
            post.setUpdatedAt(OffsetDateTime.now());
            return post;
        });
        when(postPhotoRepository.findAllByPostIdOrderByUploadedAtAsc(postId)).thenReturn(List.of());

        ServicePostDetailResponse response = servicePostService.createPost(userId, request);

        ArgumentCaptor<ServicePost> savedPostCaptor = ArgumentCaptor.forClass(ServicePost.class);
        verify(servicePostRepository).save(savedPostCaptor.capture());

        ServicePost savedPost = savedPostCaptor.getValue();
        assertThat(savedPost.getTitle()).isEqualTo("Need plumbing help");
        assertThat(savedPost.getDescription()).isEqualTo("Fix the leaking pipe");
        assertThat(savedPost.getCategory()).isEqualTo("Plumbing");
        assertThat(savedPost.getAddressLabel()).isEqualTo("Centar");
        assertThat(savedPost.getStatus()).isEqualTo(PostStatus.REQUESTING);
        assertThat(savedPost.getContactPhone()).isEqualTo("+38970114050");
        assertThat(savedPost.getContactEmail()).isEqualTo("owner@example.com");

        assertThat(response.id()).isEqualTo(postId);
        assertThat(response.status()).isEqualTo(PostStatus.REQUESTING);
        assertThat(response.contactPhone()).isEqualTo("+38970114050");
        assertThat(response.contactEmail()).isEqualTo("owner@example.com");
    }

    @Test
    void acceptRequestRejectsOwnRequest() {
        UUID userId = UUID.randomUUID();
        UUID postId = UUID.randomUUID();

        User user = new User();
        user.setId(userId);

        ServicePost post = new ServicePost();
        post.setId(postId);
        post.setUserId(userId);
        post.setPostType(PostType.SERVICE_REQUEST);
        post.setStatus(PostStatus.REQUESTING);

        when(userRepository.findByIdAndDeletedAtIsNull(userId)).thenReturn(Optional.of(user));
        when(servicePostRepository.findByIdAndDeletedAtIsNull(postId)).thenReturn(Optional.of(post));

        assertThatThrownBy(() -> servicePostService.acceptRequest(userId, postId))
                .isInstanceOf(ConflictException.class)
                .hasMessage("You cannot accept your own request");
    }

    @Test
    void updatePostStatusRejectsInvalidRequestTransition() {
        UUID userId = UUID.randomUUID();
        UUID postId = UUID.randomUUID();

        ServicePost post = new ServicePost();
        post.setId(postId);
        post.setUserId(userId);
        post.setPostType(PostType.SERVICE_REQUEST);
        post.setStatus(PostStatus.REQUESTING);

        when(servicePostRepository.findByIdAndDeletedAtIsNull(postId)).thenReturn(Optional.of(post));

        assertThatThrownBy(() -> servicePostService.updatePostStatus(
                userId,
                postId,
                new UpdatePostStatusRequest(PostStatus.SERVICE_DONE)
        ))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Invalid status transition for service request");

        verify(servicePostRepository).findByIdAndDeletedAtIsNull(eq(postId));
    }
}
