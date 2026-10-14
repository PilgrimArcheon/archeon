-- Run once in the SAME Neon database as ARCHEON_DATABASE_URL.
-- Gmail access belongs to the authenticated invoice workspace, not a global admin.
-- Each refresh token is encrypted by ARCHEON_GMAIL_ENCRYPTION_KEY before storage.
CREATE TABLE IF NOT EXISTS invoice_workspace_gmail_connections (
  workspace_id UUID PRIMARY KEY REFERENCES archeon_workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  refresh_token_encrypted TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- The existing invoice_workspace_email_log and invoice_workspace_email_quota
-- tables in scripts/public-apps-schema.sql are used for send limits and history.
