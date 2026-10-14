-- Archeon Apps public beta / email-and-password edition. Run in Neon SQL Editor before deployment.
-- Additive migration: deliberately DOES NOT expose or overwrite the legacy
-- single-owner invoice_* tables. New records always belong to a workspace.
CREATE TABLE IF NOT EXISTS archeon_users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE CHECK(email = LOWER(email)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS archeon_password_credentials (
  user_id UUID PRIMARY KEY REFERENCES archeon_users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS archeon_workspaces (
  id UUID PRIMARY KEY,
  owner_user_id UUID NOT NULL UNIQUE REFERENCES archeon_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My workspace',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS archeon_workspace_members (
  workspace_id UUID NOT NULL REFERENCES archeon_workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES archeon_users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK(role IN ('owner', 'admin', 'member')),
  PRIMARY KEY (workspace_id,user_id)
);
CREATE INDEX IF NOT EXISTS archeon_workspace_members_user_idx ON archeon_workspace_members(user_id);
CREATE TABLE IF NOT EXISTS archeon_sessions (
  token_hash CHAR(64) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES archeon_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS archeon_sessions_user_idx ON archeon_sessions(user_id);
CREATE TABLE IF NOT EXISTS archeon_auth_rate_limits (
  fingerprint CHAR(64) PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  window_started TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_workspace_settings (
  workspace_id UUID PRIMARY KEY REFERENCES archeon_workspaces(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS invoice_workspace_clients (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES archeon_workspaces(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS invoice_workspace_clients_owner_idx ON invoice_workspace_clients(workspace_id, created_at DESC);
CREATE TABLE IF NOT EXISTS invoice_workspace_counters (
  workspace_id UUID PRIMARY KEY REFERENCES archeon_workspaces(id) ON DELETE CASCADE,
  next_no INTEGER NOT NULL DEFAULT 0 CHECK(next_no >= 0)
);
CREATE TABLE IF NOT EXISTS invoice_workspace_records (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES archeon_workspaces(id) ON DELETE CASCADE,
  invoice_no TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  UNIQUE(workspace_id,invoice_no)
);
CREATE INDEX IF NOT EXISTS invoice_workspace_records_owner_idx ON invoice_workspace_records(workspace_id,updated_at DESC);
CREATE TABLE IF NOT EXISTS invoice_workspace_email_log (
  id BIGSERIAL PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES archeon_workspaces(id) ON DELETE CASCADE,
  -- Keep delivery/abuse logs after an invoice is deleted (subject to retention policy).
  invoice_id UUID REFERENCES invoice_workspace_records(id) ON DELETE SET NULL,
  recipient TEXT NOT NULL,
  delivery_status TEXT NOT NULL CHECK(delivery_status IN ('reserved','accepted','failed')),
  detail TEXT,
  send_window TIMESTAMPTZ NOT NULL DEFAULT DATE_TRUNC('minute',NOW()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id,invoice_id,send_window)
);
CREATE INDEX IF NOT EXISTS invoice_workspace_email_log_limits_idx ON invoice_workspace_email_log(workspace_id,created_at DESC);
-- Atomic per-workspace quota prevents simultaneous sends from bypassing the limit.
CREATE TABLE IF NOT EXISTS invoice_workspace_email_quota (
  workspace_id UUID NOT NULL REFERENCES archeon_workspaces(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  PRIMARY KEY(workspace_id, day)
);

-- For production: use a restricted server-only database role. Application SQL
-- scopes every query to workspace_id; do not expose INVOICE_DATABASE_URL to the browser.
-- Periodically purge expired archeon_sessions and old rate-limit rows.

-- Optional Gmail OAuth connection (personal Gmail addresses, no sending domain).
-- See scripts/gmail-oauth-migration.sql for existing Neon databases.
CREATE TABLE IF NOT EXISTS invoice_workspace_gmail_connections (
  workspace_id UUID PRIMARY KEY REFERENCES archeon_workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  refresh_token_encrypted TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
