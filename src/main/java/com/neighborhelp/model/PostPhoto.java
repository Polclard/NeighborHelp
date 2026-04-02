package com.neighborhelp.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "post_photos")
public class PostPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "post_id", nullable = false)
    private UUID postId;

    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private OffsetDateTime uploadedAt;

    @PrePersist
    protected void onCreate(){
        if(uploadedAt == null){
            uploadedAt = OffsetDateTime.now();
        }
    }

}
