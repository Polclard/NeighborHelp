package com.neighborhelp.service.impl;

import com.neighborhelp.service.FileStorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "app.storage.provider", havingValue = "local", matchIfMissing = true)
public class LocalFileStorageService implements FileStorageService {

    private static final String PUBLIC_UPLOAD_PREFIX = "/uploads/";

    @Value("${app.upload.dir:./var/uploads}")
    private String uploadDir;

    @Override
    public String storeProfileAvatar(UUID userId, MultipartFile file) {
        return storeImage(Path.of("avatars"), userId + "-" + UUID.randomUUID(), file);
    }

    @Override
    public String storePostPhoto(UUID postId, MultipartFile file) {
        return storeImage(Path.of("posts", postId.toString()), UUID.randomUUID().toString(), file);
    }

    @Override
    public void deleteStoredFile(String storedPath) {
        if (storedPath == null || storedPath.isBlank()) {
            return;
        }

        if (!storedPath.startsWith(PUBLIC_UPLOAD_PREFIX)) {
            throw new IllegalArgumentException("Stored file path is invalid");
        }

        try {
            Path rootDirectory = Paths.get(uploadDir).toAbsolutePath().normalize();
            String relativePath = storedPath.substring(PUBLIC_UPLOAD_PREFIX.length());
            if (relativePath.isBlank()) {
                throw new IllegalArgumentException("Stored file path is invalid");
            }

            Path target = rootDirectory.resolve(relativePath).normalize();

            if (!target.startsWith(rootDirectory) || target.equals(rootDirectory) || Files.isDirectory(target)) {
                throw new IllegalArgumentException("Stored file path is invalid");
            }

            Files.deleteIfExists(target);
            deleteEmptyParents(target.getParent(), rootDirectory);
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to delete stored file", exception);
        }
    }

    private String storeImage(Path relativeDirectory, String filenamePrefix, MultipartFile file) {
        try {
            Path rootDirectory = Paths.get(uploadDir).toAbsolutePath().normalize();
            Path targetDirectory = rootDirectory.resolve(relativeDirectory).normalize();
            Files.createDirectories(targetDirectory);

            String extension = resolveExtension(file.getContentType());
            String filename = filenamePrefix + extension;
            Path target = targetDirectory.resolve(filename).normalize();

            if (!target.startsWith(targetDirectory)) {
                throw new IllegalArgumentException("Invalid file path");
            }

            file.transferTo(target.toFile());

            String relativePath = relativeDirectory.resolve(filename).toString().replace("\\", "/");
            return PUBLIC_UPLOAD_PREFIX + relativePath;
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to store image", exception);
        }
    }

    private void deleteEmptyParents(Path directory, Path rootDirectory) throws IOException {
        Path current = directory;

        while (current != null && !current.equals(rootDirectory) && current.startsWith(rootDirectory)) {
            if (!Files.isDirectory(current) || hasDirectoryEntries(current)) {
                return;
            }

            Files.deleteIfExists(current);
            current = current.getParent();
        }
    }

    private boolean hasDirectoryEntries(Path directory) throws IOException {
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(directory)) {
            return stream.iterator().hasNext();
        }
    }

    private String resolveExtension(String contentType) {
        if ("image/jpeg".equalsIgnoreCase(contentType)) {
            return ".jpg";
        }
        if ("image/png".equalsIgnoreCase(contentType)) {
            return ".png";
        }
        if ("image/webp".equalsIgnoreCase(contentType)) {
            return ".webp";
        }

        throw new IllegalArgumentException("Unsupported image type");
    }
}
