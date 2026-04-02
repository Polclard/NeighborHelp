package com.neighborhelp.repository;

import com.neighborhelp.model.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConversationRepository extends JpaRepository<Conversation, UUID> {
    List<Conversation> findAllByUserAIdOrUserBId(UUID userAId, UUID userBId);

    @Query("""
        select c
        from Conversation c
        where ((c.userAId = :userOne and c.userBId = :userTwo)
            or (c.userAId = :userTwo and c.userBId = :userOne))
          and ((:postId is null and c.postId is null) or c.postId = :postId)
    """)
    Optional<Conversation> findBetweenUsersAndPost(UUID userOne, UUID userTwo, UUID postId);
}

