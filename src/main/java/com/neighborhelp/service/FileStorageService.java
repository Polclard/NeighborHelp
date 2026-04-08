package com.neighborhelp.service;

import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface FileStorageService {

    String storeProfileAvatar(UUID userId, MultipartFile file);

    String storePostPhoto(UUID postId, MultipartFile file);
}
