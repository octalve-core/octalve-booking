-- B2 identity/tenancy foundation: reviewed schema, not an applied production migration.
-- Run with a migration-only database role after backups, DBA review and provider selection.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE SCHEMA IF NOT EXISTS booking_auth;
CREATE TABLE IF NOT EXISTS booking_auth.users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 email citext NOT NULL UNIQUE,
 full_name text NOT NULL CHECK (length(btrim(full_name)) BETWEEN 2 AND 120),
 phone_e164 text CHECK (phone_e164 ~ '^\\+[1-9][0-9]{6,14}$'),
 password_digest text, -- hashed with server-only scrypt+pepper, NEVER plain text
 verified_at timestamptz,
 disabled_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS booking_auth.workspaces (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name text NOT NULL CHECK(length(btrim(name)) BETWEEN 2 AND 120),
 slug text NOT NULL UNIQUE CHECK(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 kind text NOT NULL CHECK(kind IN ('business','individual')),
 timezone text NOT NULL DEFAULT 'Africa/Lagos',
 currency char(3) NOT NULL DEFAULT 'NGN',
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS booking_auth.memberships (
 workspace_id uuid NOT NULL REFERENCES booking_auth.workspaces(id) ON DELETE RESTRICT,
 user_id uuid NOT NULL REFERENCES booking_auth.users(id) ON DELETE RESTRICT,
 role text NOT NULL CHECK(role IN ('owner','admin','manager','staff','viewer')),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','suspended','removed')),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (workspace_id,user_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS booking_one_active_owner_per_workspace ON booking_auth.memberships(workspace_id) WHERE role='owner' AND status='active';
CREATE INDEX IF NOT EXISTS booking_memberships_user_active_idx ON booking_auth.memberships(user_id,workspace_id) WHERE status='active';
CREATE TABLE IF NOT EXISTS booking_auth.sessions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES booking_auth.users(id) ON DELETE CASCADE,
 token_digest char(64) NOT NULL UNIQUE,
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL,
 last_seen_at timestamptz,
 revoked_at timestamptz,
 CHECK(expires_at>created_at)
);
CREATE INDEX IF NOT EXISTS booking_sessions_user_active_idx ON booking_auth.sessions(user_id,expires_at) WHERE revoked_at IS NULL;
CREATE TABLE IF NOT EXISTS booking_auth.one_time_tokens (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES booking_auth.users(id) ON DELETE CASCADE,
 purpose text NOT NULL CHECK(purpose IN ('email-verification','password-reset')),
 token_digest char(64) NOT NULL UNIQUE,
 expires_at timestamptz NOT NULL,
 consumed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(expires_at>created_at)
);
CREATE INDEX IF NOT EXISTS booking_otp_user_purpose_idx ON booking_auth.one_time_tokens(user_id,purpose) WHERE consumed_at IS NULL;
CREATE TABLE IF NOT EXISTS booking_auth.oauth_identities (
 provider text NOT NULL CHECK(provider='google'),
 provider_subject text NOT NULL,
 user_id uuid NOT NULL REFERENCES booking_auth.users(id) ON DELETE CASCADE,
 connected_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(provider,provider_subject),
 UNIQUE(provider,user_id)
);
CREATE TABLE IF NOT EXISTS booking_auth.invitations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 workspace_id uuid NOT NULL REFERENCES booking_auth.workspaces(id) ON DELETE CASCADE,
 email citext NOT NULL,
 role text NOT NULL CHECK(role IN ('admin','manager','staff','viewer')),
 token_digest char(64) NOT NULL UNIQUE,
 issued_by uuid NOT NULL REFERENCES booking_auth.users(id) ON DELETE RESTRICT,
 expires_at timestamptz NOT NULL,
 consumed_at timestamptz,
 revoked_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(expires_at>created_at)
);
CREATE TABLE IF NOT EXISTS booking_auth.auth_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 user_id uuid REFERENCES booking_auth.users(id) ON DELETE SET NULL,
 workspace_id uuid REFERENCES booking_auth.workspaces(id) ON DELETE SET NULL,
 event_type text NOT NULL,
 occurred_at timestamptz NOT NULL DEFAULT now(),
 correlation_id text,
 source_ip_digest char(64)
);
-- Explicitly deny direct access from any public/browser-connected database role.
REVOKE ALL ON SCHEMA booking_auth FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA booking_auth FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA booking_auth FROM PUBLIC;
-- Application queries must be performed by a trusted server using scoped membership verification.
ALTER TABLE booking_auth.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_auth.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_auth.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_auth.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_auth.one_time_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_auth.oauth_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_auth.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_auth.auth_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_auth.users FORCE ROW LEVEL SECURITY;
ALTER TABLE booking_auth.workspaces FORCE ROW LEVEL SECURITY;
ALTER TABLE booking_auth.memberships FORCE ROW LEVEL SECURITY;
ALTER TABLE booking_auth.sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE booking_auth.one_time_tokens FORCE ROW LEVEL SECURITY;
ALTER TABLE booking_auth.oauth_identities FORCE ROW LEVEL SECURITY;
ALTER TABLE booking_auth.invitations FORCE ROW LEVEL SECURITY;
ALTER TABLE booking_auth.auth_events FORCE ROW LEVEL SECURITY;
COMMIT;
