-- TackBoard PostgreSQL schema proposal for existing Archeon Neon database.
-- Additive only. Review against production schema before executing.
-- Prerequisite: run the existing scripts/public-apps-schema.sql on the target Neon branch.
-- The access control and owner+5 invited seat cap must be enforced in API transactions.
BEGIN;

CREATE TABLE IF NOT EXISTS tack_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES archeon_users(id) ON DELETE CASCADE,
  name VARCHAR(80) NOT NULL CHECK (length(trim(name)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS tack_boards_owner_idx ON tack_boards(owner_user_id);

CREATE TABLE IF NOT EXISTS tack_board_members (
  board_id UUID NOT NULL REFERENCES tack_boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES archeon_users(id) ON DELETE CASCADE,
  role VARCHAR(12) NOT NULL CHECK(role IN ('owner','editor','viewer')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(board_id,user_id)
);
CREATE INDEX IF NOT EXISTS tack_board_members_user_idx ON tack_board_members(user_id,board_id);
CREATE UNIQUE INDEX IF NOT EXISTS tack_one_owner_idx ON tack_board_members(board_id) WHERE role='owner';

CREATE TABLE IF NOT EXISTS tack_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES tack_boards(id) ON DELETE CASCADE,
  created_by UUID REFERENCES archeon_users(id) ON DELETE SET NULL,
  title VARCHAR(90) NOT NULL CHECK(length(trim(title)) > 0),
  body VARCHAR(1200) NOT NULL DEFAULT '',
  color VARCHAR(10) NOT NULL DEFAULT 'butter' CHECK(color IN ('butter','mint','lilac','rose','sky','paper')),
  status VARCHAR(10) NOT NULL DEFAULT 'planned' CHECK(status IN ('planned','active','review','done')),
  x DOUBLE PRECISION NOT NULL DEFAULT 0,
  y DOUBLE PRECISION NOT NULL DEFAULT 0,
  layer INTEGER NOT NULL DEFAULT 0,
  archived_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1 CHECK(version>0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS tack_notes_board_idx ON tack_notes(board_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS tack_notes_active_idx ON tack_notes(board_id,layer) WHERE archived_at IS NULL;

CREATE TABLE IF NOT EXISTS tack_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES tack_notes(id) ON DELETE CASCADE,
  text VARCHAR(180) NOT NULL CHECK(length(trim(text))>0),
  done BOOLEAN NOT NULL DEFAULT FALSE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS tack_tasks_note_idx ON tack_tasks(note_id,position);

CREATE TABLE IF NOT EXISTS tack_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES tack_boards(id) ON DELETE CASCADE,
  email TEXT NOT NULL CHECK(email = lower(email)),
  role VARCHAR(12) NOT NULL DEFAULT 'editor' CHECK(role IN ('editor','viewer')),
  token_hash CHAR(64) NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES archeon_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS tack_invitations_board_idx ON tack_invitations(board_id,created_at DESC);
CREATE INDEX IF NOT EXISTS tack_invitations_email_idx ON tack_invitations(email);

CREATE TABLE IF NOT EXISTS tack_activity (
  id BIGSERIAL PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES tack_boards(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES archeon_users(id) ON DELETE SET NULL,
  action VARCHAR(40) NOT NULL,
  entity_type VARCHAR(20),
  entity_id UUID,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS tack_activity_board_idx ON tack_activity(board_id,created_at DESC);
COMMIT;

-- IMPORTANT implementation invariants (not accomplished by schema alone):
-- (1) On board creation, create tack_board_members owner row in the SAME transaction.
-- (2) Every board query/mutation checks current signed-in user membership and role.
-- (3) To invite or accept, lock tack_boards row in a transaction; count distinct
--     invited non-owner members + live pending invites; reject if > 5 seats.
-- (4) Match accepted invite email to the verified signed-in account email.
-- (5) Do not leak tokens; store SHA-256 hashes only, expire and consume once.
-- (6) Use note version comparison for concurrent updates (409 on stale version).
