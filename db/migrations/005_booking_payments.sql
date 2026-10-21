-- B4 payment authority records; no client-facing payment action is enabled.
BEGIN;
CREATE SCHEMA IF NOT EXISTS booking_payments;
CREATE TABLE booking_payments.intent (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 workspace_id uuid NOT NULL REFERENCES booking_auth.workspaces(id),
 booking_id uuid NOT NULL,
 provider text NOT NULL CHECK(provider IN ('paystack','flutterwave','monnify','manual_bank')),
 amount_minor bigint NOT NULL CHECK(amount_minor>0),
 currency char(3) NOT NULL CHECK(currency ~ '^[A-Z]{3}$'),
 provider_reference text,
 state text NOT NULL DEFAULT 'initialized' CHECK(state IN ('initialized','pending','verified','failed','expired','refunded','part_refunded')),
 created_at timestamptz NOT NULL DEFAULT now(),
 verified_at timestamptz,
 UNIQUE(id,workspace_id),
 UNIQUE(provider,provider_reference),
 FOREIGN KEY(booking_id,workspace_id) REFERENCES booking_core.bookings(id,workspace_id)
);
CREATE INDEX booking_intent_workspace_idx ON booking_payments.intent(workspace_id,created_at DESC);
CREATE TABLE booking_payments.provider_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 provider text NOT NULL CHECK(provider IN ('paystack','flutterwave','monnify')),
 provider_event_id text NOT NULL,
 intent_id uuid REFERENCES booking_payments.intent(id),
 signature_verified boolean NOT NULL DEFAULT false,
 payload_digest char(64) NOT NULL CHECK(payload_digest ~ '^[0-9a-f]{64}$'),
 received_at timestamptz NOT NULL DEFAULT now(),
 processed_at timestamptz,
 processing_status text NOT NULL DEFAULT 'received' CHECK(processing_status IN ('received','applied','ignored','error')),
 UNIQUE(provider,provider_event_id)
);
CREATE INDEX booking_payment_events_intent_idx ON booking_payments.provider_events(intent_id);
CREATE TABLE booking_payments.manual_bank_reviews (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 workspace_id uuid NOT NULL REFERENCES booking_auth.workspaces(id),
 intent_id uuid NOT NULL,
 reference text,
 evidence_digest char(64),
 decision text NOT NULL DEFAULT 'pending' CHECK(decision IN ('pending','approved','rejected')),
 decided_by uuid REFERENCES booking_auth.users(id),
 decided_at timestamptz,
 CHECK ((decision='pending' AND decided_at IS NULL) OR
    (decision<>'pending' AND decided_by IS NOT NULL AND decided_at IS NOT NULL)),
 FOREIGN KEY(intent_id,workspace_id) REFERENCES booking_payments.intent(id,workspace_id)
);
CREATE TABLE booking_payments.refund_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 workspace_id uuid NOT NULL REFERENCES booking_auth.workspaces(id),
 intent_id uuid NOT NULL,
 amount_minor bigint NOT NULL CHECK(amount_minor>0),
 provider_refund_reference text,
 status text NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','submitted','confirmed','failed')),
 provider_verified_at timestamptz,
 requested_by uuid REFERENCES booking_auth.users(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(intent_id,workspace_id) REFERENCES booking_payments.intent(id,workspace_id)
);
CREATE UNIQUE INDEX booking_refunds_provider_reference_idx
 ON booking_payments.refund_events(provider_refund_reference) WHERE provider_refund_reference IS NOT NULL;
CREATE TABLE booking_payments.reconciliation_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 workspace_id uuid NOT NULL REFERENCES booking_auth.workspaces(id),
 intent_id uuid NOT NULL,
 event_type text NOT NULL,
 details_digest char(64),
 recorded_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(intent_id,workspace_id) REFERENCES booking_payments.intent(id,workspace_id)
);
REVOKE ALL ON SCHEMA booking_payments FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA booking_payments FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA booking_payments FROM PUBLIC;
ALTER TABLE booking_payments.intent ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_payments.provider_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_payments.manual_bank_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_payments.refund_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_payments.reconciliation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_payments.intent FORCE ROW LEVEL SECURITY;
ALTER TABLE booking_payments.provider_events FORCE ROW LEVEL SECURITY;
ALTER TABLE booking_payments.manual_bank_reviews FORCE ROW LEVEL SECURITY;
ALTER TABLE booking_payments.refund_events FORCE ROW LEVEL SECURITY;
ALTER TABLE booking_payments.reconciliation_events FORCE ROW LEVEL SECURITY;
COMMIT;
