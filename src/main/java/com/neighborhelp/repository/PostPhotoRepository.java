package com.neighborhelp.repository;

import com.neighborhelp.model.PostPhoto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PostPhotoRepository extends JpaRepository<PostPhoto, UUID> {
    List<PostPhoto> findAllByPostIdOrderByUploadedAtAsc(UUID postId);
}
