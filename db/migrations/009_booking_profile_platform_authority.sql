-- Phase 15: optional account profile fields and segregated Octalve platform authority.
-- Platform membership is never self-issued by signup or workspace-owner flows.
BEGIN;
ALTER TABLE booking_auth.users ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'en';
ALTER TABLE booking_auth.workspaces ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE booking_auth.workspaces ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE TABLE IF NOT EXISTS booking_auth.platform_memberships (
 user_id uuid PRIMARY KEY REFERENCES booking_auth.users(id) ON DELETE RESTRICT,
 role text NOT NULL CHECK (role IN ('platform_owner','platform_admin','finance','support','security','analyst')),
 status text NOT NULL DEFAULT 'suspended' CHECK (status IN ('active','suspended','revoked')),
 mfa_verified_at timestamptz,
 granted_by uuid REFERENCES booking_auth.users(id) ON DELETE RESTRICT,
 granted_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK (status<>'active' OR (granted_by IS NOT NULL AND mfa_verified_at IS NOT NULL))
);
CREATE TABLE IF NOT EXISTS booking_auth.platform_audit_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 actor_user_id uuid REFERENCES booking_auth.users(id) ON DELETE SET NULL,
 target_user_id uuid REFERENCES booking_auth.users(id) ON DELETE SET NULL,
 event_type text NOT NULL,
 occurred_at timestamptz NOT NULL DEFAULT now(),
 correlation_id text,
 details_digest char(64),
 CHECK (details_digest IS NULL OR details_digest ~ '^[a-f0-9]{64}$')
);
REVOKE ALL ON booking_auth.platform_memberships FROM PUBLIC;
REVOKE ALL ON booking_auth.platform_audit_events FROM PUBLIC;
ALTER TABLE booking_auth.platform_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_auth.platform_memberships FORCE ROW LEVEL SECURITY;
ALTER TABLE booking_auth.platform_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_auth.platform_audit_events FORCE ROW LEVEL SECURITY;
-- No policies or grants for the business authentication role.
-- Privileged runtime roles/policies require a separate audited approval and MFA enforcement.
COMMIT;
