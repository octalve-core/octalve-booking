-- Email delivery is transactional with account/token changes.
-- Encrypted tokens only: plaintext verification/reset credentials must never enter this table.
BEGIN;
CREATE TABLE IF NOT EXISTS booking_auth.mail_outbox (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 recipient citext NOT NULL,
 kind text NOT NULL CHECK(kind IN ('verification','password-reset')),
 sealed_token text NOT NULL,
 token_expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 not_before timestamptz NOT NULL DEFAULT now(),
 status text NOT NULL DEFAULT 'pending'
   CHECK(status IN ('pending','processing','delivered','exhausted')),
 attempts integer NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 100),
 lease_id uuid,
 leased_until timestamptz,
 delivered_at timestamptz,
 last_error_code text,
 CHECK(token_expires_at>created_at)
);
CREATE INDEX IF NOT EXISTS booking_auth_mail_pending_idx ON booking_auth.mail_outbox
 (not_before,created_at) WHERE status IN ('pending','processing');
REVOKE ALL ON booking_auth.mail_outbox FROM PUBLIC;
ALTER TABLE booking_auth.mail_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_auth.mail_outbox FORCE ROW LEVEL SECURITY;
COMMIT;
