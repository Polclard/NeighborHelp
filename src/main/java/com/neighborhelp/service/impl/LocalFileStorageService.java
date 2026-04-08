package com.neighborhelp.service.impl;

import com.neighborhelp.service.FileStorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class LocalFileStorageService implements FileStorageService {

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
            return "/uploads/" + relativePath;
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to store image", exception);
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