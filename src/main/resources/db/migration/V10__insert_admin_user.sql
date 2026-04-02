INSERT INTO users (
    id,
    first_name,
    last_name,
    email,
    password_hash,
    role,
    is_banned,
    average_rating,
    review_count,
    created_at,
    updated_at
)
SELECT
    'ef1d427a-d149-4c00-abbd-4d0733595d8f'::uuid,
    'System',
    'Admin',
    'admin@neighborhelp.local',
    '$2y$10$OELQKS.M9Zw9vFAgkEAYy.r7FPtjJwQyrbWx06PjNWHMgeXkUSEJm',
    'ROLE_ADMIN',
    FALSE,
    0.00,
    0,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1
    FROM users
    WHERE email = 'admin@neighborhelp.local'
);