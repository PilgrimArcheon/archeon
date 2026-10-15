-- Additive Archeon support inbox migration. Run once on your existing Neon database.
-- Does not modify users, TackBoard cloud documents or invoice records.
BEGIN;
CREATE TABLE IF NOT EXISTS archeon_feedback (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES archeon_users(id) ON DELETE SET NULL,
  category VARCHAR(24) NOT NULL CHECK(category IN ('question','bug','feature','app_request')),
  source_app VARCHAR(40) NOT NULL DEFAULT 'archeon',
  subject VARCHAR(160) NOT NULL,
  message TEXT NOT NULL CHECK(char_length(message) BETWEEN 10 AND 4000),
  reply_email VARCHAR(254),
  status VARCHAR(16) NOT NULL DEFAULT 'new' CHECK(status IN ('new','reviewing','resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS archeon_feedback_recent_idx ON archeon_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS archeon_feedback_status_idx ON archeon_feedback(status, created_at DESC);
CREATE TABLE IF NOT EXISTS archeon_feedback_rate_limits (
  fingerprint CHAR(64) PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  window_started TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMIT;
