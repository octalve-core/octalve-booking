-- B2 durable, distributed throttling foundation. Does not grant runtime access.
BEGIN;
CREATE TABLE IF NOT EXISTS booking_auth.rate_limits (
 rate_key char(64) PRIMARY KEY CHECK(rate_key ~ '^[0-9a-f]{64}$'),
 window_started timestamptz NOT NULL,
 attempts integer NOT NULL CHECK(attempts>=1),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS booking_rate_limits_window_idx ON booking_auth.rate_limits(window_started);
REVOKE ALL ON booking_auth.rate_limits FROM PUBLIC;
ALTER TABLE booking_auth.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_auth.rate_limits FORCE ROW LEVEL SECURITY;
COMMIT;
