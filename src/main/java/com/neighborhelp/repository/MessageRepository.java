package com.neighborhelp.repository;

import com.neighborhelp.model.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {

    List<Message> findAllByConversationIdOrderBySentAtAsc(UUID conversationId);

    Page<Message> findAllByConversationIdAndDeletedAtIsNullOrderBySentAtAsc(UUID conversationId, Pageable pageable);
}