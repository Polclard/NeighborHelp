package com.neighborhelp.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import com.neighborhelp.config.CloudinaryProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CloudinaryFileStorageServiceTest {

    private static final String SECURE_URL =
            "https://res.cloudinary.com/demo/image/upload/v1712345678/neighborhelp/avatars/photo.jpg";

    private Cloudinary cloudinary;
    private Uploader uploader;
    private CloudinaryFileStorageService storageService;

    @BeforeEach
    void setUp() {
        cloudinary = mock(Cloudinary.class);
        uploader = mock(Uploader.class);
        when(cloudinary.uploader()).thenReturn(uploader);

        CloudinaryProperties properties = new CloudinaryProperties();
        properties.setCloudName("demo");
        properties.setApiKey("key");
        properties.setApiSecret("secret");
        properties.setFolder("neighborhelp");

        storageService = new CloudinaryFileStorageService(cloudinary, properties);
    }

    @Test
    void avatarUploadUsesFolderedPublicIdAndReturnsSecureUrl() throws Exception {
        when(uploader.upload(any(), any())).thenReturn(uploadResult());

        UUID userId = UUID.randomUUID();
        String storedUrl = storageService.storeProfileAvatar(userId, imageFile());

        assertThat(storedUrl).isEqualTo(SECURE_URL);

        assertThat(capturedPublicId()).startsWith("neighborhelp/avatars/" + userId + "-");
    }

    @Test
    void postPhotoUploadGroupsByPostId() throws Exception {
        when(uploader.upload(any(), any())).thenReturn(uploadResult());

        UUID postId = UUID.randomUUID();
        storageService.storePostPhoto(postId, imageFile());

        assertThat(capturedPublicId()).startsWith("neighborhelp/posts/" + postId + "/");
    }

    @Test
    void uploadWithoutSecureUrlFails() throws Exception {
        when(uploader.upload(any(), any())).thenReturn(new HashMap<>());

        assertThatThrownBy(() -> storageService.storeProfileAvatar(UUID.randomUUID(), imageFile()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Cloudinary upload returned no secure_url");
    }

    @Test
    void deleteRecoversPublicIdFromStoredUrl() throws Exception {
        storageService.deleteStoredFile(SECURE_URL);

        verify(uploader).destroy(eq("neighborhelp/avatars/photo"), any());
    }

    @Test
    void deleteIgnoresTransformationSegments() throws Exception {
        storageService.deleteStoredFile(
                "https://res.cloudinary.com/demo/image/upload/c_fill,w_88,h_88/f_auto/v1712345678/neighborhelp/posts/abc/photo.webp");

        verify(uploader).destroy(eq("neighborhelp/posts/abc/photo"), any());
    }

    @Test
    void deleteHandlesUrlWithoutVersionSegment() throws Exception {
        storageService.deleteStoredFile(
                "https://res.cloudinary.com/demo/image/upload/neighborhelp/avatars/photo.png");

        verify(uploader).destroy(eq("neighborhelp/avatars/photo"), any());
    }

    @Test
    void deletePreservesFolderNamesThatLookLikeTransformations() throws Exception {
        storageService.deleteStoredFile(
                "https://res.cloudinary.com/demo/image/upload/v1712345678/nh_prod/avatars/photo.jpg");

        verify(uploader).destroy(eq("nh_prod/avatars/photo"), any());
    }

    @Test
    void deletePreservesUnderscoredFolderWithoutVersionSegment() throws Exception {
        storageService.deleteStoredFile(
                "https://res.cloudinary.com/demo/image/upload/nh_prod/avatars/photo.jpg");

        verify(uploader).destroy(eq("nh_prod/avatars/photo"), any());
    }

    @Test
    void deleteRejectsNonCloudinaryPath() {
        assertThatThrownBy(() -> storageService.deleteStoredFile("/uploads/avatars/photo.png"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Stored file path is not a Cloudinary delivery URL");
    }

    @Test
    void deleteIsANoOpForBlankValues() throws Exception {
        storageService.deleteStoredFile(null);
        storageService.deleteStoredFile("  ");

        verify(uploader, never()).destroy(any(), any());
    }

    private String capturedPublicId() throws Exception {
        ArgumentCaptor<Map<String, Object>> options = ArgumentCaptor.captor();
        verify(uploader).upload(any(), options.capture());
        return String.valueOf(options.getValue().get("public_id"));
    }

    private Map<String, Object> uploadResult() {
        Map<String, Object> result = new HashMap<>();
        result.put("secure_url", SECURE_URL);
        return result;
    }

    private MockMultipartFile imageFile() {
        return new MockMultipartFile(
                "file",
                "photo.jpg",
                "image/jpeg",
                "image-bytes".getBytes(StandardCharsets.UTF_8)
        );
    }
}
