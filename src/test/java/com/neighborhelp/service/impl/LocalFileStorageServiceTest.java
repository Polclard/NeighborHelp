package com.neighborhelp.service.impl;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LocalFileStorageServiceTest {

    @TempDir
    Path tempDir;

    @Test
    void storedFilesCanBeDeletedByPublicPath() throws Exception {
        LocalFileStorageService storageService = new LocalFileStorageService();
        ReflectionTestUtils.setField(storageService, "uploadDir", tempDir.toString());

        String storedPath = storageService.storeProfileAvatar(
                UUID.randomUUID(),
                new MockMultipartFile(
                        "file",
                        "avatar.png",
                        "image/png",
                        "avatar-bytes".getBytes(StandardCharsets.UTF_8)
                )
        );

        Path fileOnDisk = tempDir.resolve(storedPath.substring("/uploads/".length()));
        assertThat(Files.exists(fileOnDisk)).isTrue();

        storageService.deleteStoredFile(storedPath);

        assertThat(Files.exists(fileOnDisk)).isFalse();
    }

    @Test
    void invalidDeletionPathIsRejected() {
        LocalFileStorageService storageService = new LocalFileStorageService();
        ReflectionTestUtils.setField(storageService, "uploadDir", tempDir.toString());

        assertThatThrownBy(() -> storageService.deleteStoredFile("/uploads/../../etc/passwd"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Stored file path is invalid");
    }
}
