CREATE INDEX IF NOT EXISTS idx_service_posts_user_id ON service_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_service_posts_post_type ON service_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_service_posts_status ON service_posts(status);
CREATE INDEX IF NOT EXISTS idx_service_posts_category ON service_posts(category);
CREATE INDEX IF NOT EXISTS idx_service_posts_deleted_at ON service_posts(deleted_at);

CREATE INDEX IF NOT EXISTS idx_post_photos_post_id ON post_photos(post_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_user_id ON reviews(reviewed_user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_post_id ON reviews(post_id);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_resolved ON reports(resolved);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);

CREATE UNIQUE INDEX IF NOT EXISTS ux_conversations_pair_post
    ON conversations (
        LEAST(user_a_id, user_b_id),
        GREATEST(user_a_id, user_b_id),
        COALESCE(post_id, '00000000-0000-0000-0000-000000000000'::uuid)
    );