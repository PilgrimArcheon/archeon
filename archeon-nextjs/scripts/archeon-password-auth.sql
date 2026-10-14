-- Archeon password accounts — additive migration. Run on the existing Neon branch.
-- Prerequisite: scripts/public-apps-schema.sql has already been executed.
-- Does not change or delete Invoice Studio, Tackboard, magic-link or session records.
-- Existing magic-link-only users are NOT automatically assigned passwords.
BEGIN;
CREATE TABLE IF NOT EXISTS archeon_password_credentials (
    user_id UUID PRIMARY KEY REFERENCES archeon_users(id) ON DELETE CASCADE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMIT;
