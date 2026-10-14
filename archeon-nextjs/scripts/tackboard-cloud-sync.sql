-- TackBoard cloud sync / browser companion (Neon).
-- Additive; requires archeon_users from scripts/public-apps-schema.sql.
-- Safe to run on a development branch first.
BEGIN;
CREATE TABLE IF NOT EXISTS tack_sync_documents (
  user_id UUID PRIMARY KEY REFERENCES archeon_users(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  revision BIGINT NOT NULL DEFAULT 1 CHECK (revision >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS tack_extension_tokens (
  token_hash CHAR(64) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES archeon_users(id) ON DELETE CASCADE,
  label VARCHAR(60) NOT NULL DEFAULT 'Browser companion',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS tack_extension_tokens_user ON tack_extension_tokens(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS tack_extension_tokens_expiry ON tack_extension_tokens(expires_at);
COMMIT;
-- Cloud document is scoped to the signed-in owner; never accept a userId from the request body.
-- Tokens are scoped ONLY to TackBoard sync, not to Archeon Invoice Studio.
