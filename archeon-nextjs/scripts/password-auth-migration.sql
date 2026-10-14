-- Apply to a Neon database that already used the magic-link version.
-- Safe and additive; existing user workspaces/invoices remain intact.
-- Existing magic-link accounts cannot sign in with a password until assigned
-- credentials in a separately verified migration. Do NOT automatically assign
-- passwords or let unverified visitors claim existing email accounts.
CREATE TABLE IF NOT EXISTS archeon_password_credentials (
  user_id UUID PRIMARY KEY REFERENCES archeon_users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Old archeon_magic_links rows can be deleted once nobody needs them:
-- DELETE FROM archeon_magic_links;
