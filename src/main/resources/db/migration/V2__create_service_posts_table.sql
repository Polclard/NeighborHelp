CREATE TABLE IF NOT EXISTS service_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    post_type VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL,
    category VARCHAR(100) NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    address_label VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    accepted_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT chk_service_posts_post_type CHECK (post_type IN ('SERVICE_REQUEST', 'SERVICE_OFFER')),
    CONSTRAINT chk_service_posts_status CHECK (
            status IN (
            'REQUESTING',
            'SERVICE_ACCEPTED',
            'SERVICE_DONE',
            'CANCELLED',
            'OFFERING',
            'UNAVAILABLE',
            'CLOSED'
        )
    ),
    CONSTRAINT chk_service_posts_latitude CHECK (latitude BETWEEN -90 AND 90),
    CONSTRAINT chk_service_posts_longitude CHECK (longitude BETWEEN -180 AND 180)
);