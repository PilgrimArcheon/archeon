-- Run once in the Neon SQL Editor; safe to run again.
CREATE TABLE IF NOT EXISTS invoice_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_clients (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_counters (
  id INTEGER PRIMARY KEY,
  next_no INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS invoice_records (
  id TEXT PRIMARY KEY,
  invoice_no TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS invoice_records_updated_at_idx ON invoice_records (updated_at DESC);

CREATE TABLE IF NOT EXISTS invoice_email_log (
  id BIGSERIAL PRIMARY KEY,
  invoice_id TEXT NOT NULL,
  recipient TEXT NOT NULL,
  delivery_status TEXT NOT NULL,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Failed sign-in limits for the private invoice workspace.
CREATE TABLE IF NOT EXISTS invoice_login_attempts (
  fingerprint TEXT PRIMARY KEY,
  failures INTEGER NOT NULL DEFAULT 0,
  window_started TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
