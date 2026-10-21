## Identity mail worker and runtime policy

Production identity is gated by `BOOKING_AUTH_ENABLED=1`, required environment secrets, a valid HTTPS Booking origin, a non-superuser/non-BYPASSRLS login, **10 Booking auth RLS policies**, and membership in the dedicated `booking_identity_service` role defined by migration 007. Database owner must grant the runtime login membership explicitly (never commit its credentials). This role cannot access Booking client/appointment/payment schemas.

`POST /api/internal/mail-outbox` dispatches encrypted pending verification/reset emails via the Resend API. It uses constant-time comparison against `Authorization: Bearer <AUTH_OUTBOX_CRON_SECRET>` and an idempotency key. **Do not expose the cron secret in client code.** Resend sender DNS must be verified. The mailer requires a server-side scheduler; no cron is auto-enabled.

Email dispatch is at least once and retryable; provider idempotency helps avoid duplicates. Do not activate accounts until the end-to-end email→verification→session and actual role-isolation tests pass on the chosen database.
