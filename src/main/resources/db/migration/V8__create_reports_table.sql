CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES users(id),
    reported_post_id UUID REFERENCES service_posts(id) ON DELETE SET NULL,
    reported_review_id UUID REFERENCES reviews(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_reports_single_target CHECK (
       ((reported_post_id IS NOT NULL)::int + (reported_review_id IS NOT NULL)::int) = 1
   )
);