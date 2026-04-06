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
        try {
            Path rootDirectory = Paths.get(uploadDir).toAbsolutePath().normalize();
            Path avatarDirectory = rootDirectory.resolve("avatars");
            Files.createDirectories(avatarDirectory);

            String extension = resolveExtension(file.getContentType());
            String filename = userId + "-" + UUID.randomUUID() + extension;
            Path target = avatarDirectory.resolve(filename).normalize();

            if (!target.startsWith(avatarDirectory)) {
                throw new IllegalArgumentException("Invalid file path");
            }

            file.transferTo(target.toFile());
            return "/uploads/avatars/" + filename;
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to store avatar", exception);
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
