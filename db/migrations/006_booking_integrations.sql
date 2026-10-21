-- B5 integration permissions, message delivery and migration staging.
BEGIN;
CREATE SCHEMA IF NOT EXISTS booking_integrations;
CREATE TABLE booking_integrations.connections (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 workspace_id uuid NOT NULL REFERENCES booking_auth.workspaces(id),
 provider text NOT NULL CHECK(provider IN ('google-calendar','microsoft-calendar','zoom','google-meet','microsoft-teams','whatsapp','email','paystack','flutterwave','monnify')),
 provider_subject text,
 encrypted_credentials text,
 credentials_version integer NOT NULL DEFAULT 1,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','connected','revoked','error')),
 connected_at timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(id,workspace_id),
 UNIQUE(workspace_id,provider,provider_subject)
);
CREATE TABLE booking_integrations.delivery_outbox (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 workspace_id uuid NOT NULL REFERENCES booking_auth.workspaces(id),
 booking_id uuid,
 kind text NOT NULL CHECK(kind IN ('confirmation','reminder','cancellation','reschedule','calendar_sync','meeting_provision')),
 provider text,
 destination_digest char(64) NOT NULL,
 payload_ciphertext text NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','sent','failed','exhausted')),
 attempts integer NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 50),
 not_before timestamptz NOT NULL DEFAULT now(),
 lease_id uuid,
 leased_until timestamptz,
 completed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(booking_id,workspace_id) REFERENCES booking_core.bookings(id,workspace_id)
);
CREATE INDEX booking_delivery_due_idx ON booking_integrations.delivery_outbox(not_before)
 WHERE status IN ('pending','processing');
CREATE TABLE booking_integrations.import_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 workspace_id uuid NOT NULL REFERENCES booking_auth.workspaces(id),
 source text NOT NULL CHECK(source IN ('calendly_csv','cal_com_csv','ics')),
 object_digest char(64) NOT NULL,
 dry_run boolean NOT NULL DEFAULT true,
 status text NOT NULL DEFAULT 'uploaded' CHECK(status IN ('uploaded','validating','preview','approved','importing','finished','failed')),
 approved_by uuid REFERENCES booking_auth.users(id),
 approved_at timestamptz,
 inserted_rows integer NOT NULL DEFAULT 0 CHECK(inserted_rows>=0),
 rejected_rows integer NOT NULL DEFAULT 0 CHECK(rejected_rows>=0),
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(status NOT IN ('approved','importing','finished') OR (approved_by IS NOT NULL AND approved_at IS NOT NULL))
);
CREATE INDEX booking_imports_workspace_idx ON booking_integrations.import_jobs(workspace_id,created_at DESC);
REVOKE ALL ON SCHEMA booking_integrations FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA booking_integrations FROM PUBLIC;
ALTER TABLE booking_integrations.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_integrations.delivery_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_integrations.import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_integrations.connections FORCE ROW LEVEL SECURITY;
ALTER TABLE booking_integrations.delivery_outbox FORCE ROW LEVEL SECURITY;
ALTER TABLE booking_integrations.import_jobs FORCE ROW LEVEL SECURITY;
COMMIT;
