package com.neighborhelp.repository;

import com.neighborhelp.model.PostStatus;
import com.neighborhelp.model.PostType;
import com.neighborhelp.model.ServicePost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ServicePostRepository extends JpaRepository<ServicePost, UUID> {

    Optional<ServicePost> findByIdAndDeletedAtIsNull(UUID id);

    List<ServicePost> findAllByDeletedAtIsNullOrderByCreatedAtDesc();

    List<ServicePost> findAllByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID userId);

    @Query("""
                select p
                from ServicePost p
                where p.deletedAt is null
                    and (:postType is null or p.postType = :postType)
                    and (:status is null or p.status = :status)
                    and (:category is null or lower(p.category) = :category)
                    and (
                        :keyword is null
                        or lower(p.title) like :keyword
                        or lower(p.description) like :keyword
                    )
                order by p.createdAt desc
            """)
    List<ServicePost> findPublicPostsByFilters(
            @Param("postType") PostType postType,
            @Param("status") PostStatus status,
            @Param("category") String category,
            @Param("keyword") String keyword
    );
}
