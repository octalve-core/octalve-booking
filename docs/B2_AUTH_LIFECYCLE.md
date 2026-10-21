# B2 — server identity lifecycle contracts

Branch: `phase/09-b2-auth-lifecycle-contracts` on the **private** Booking repository.

Added typed contracts and injectable server-only logic for pending registration, resend and single-use email verification, verified-user sign-in, 7-day opaque sessions, logout, generic password recovery and one-use reset.

A PostgreSQL SQL adapter and transactional encrypted email outbox have been added in Phase 10; a *real* Booking-only database, least-privilege role/RLS policies, transport provider, and hosted worker are still required. One-time tokens and session transactions are coded, but not validated against an actual PostgreSQL instance. Google OIDC, per-IP throttling and audit-log dispatch remain unconfigured.

**Release authority**: All HTTP account routes still return 503. There is no real registration, session cookie issuance, Google login, reset email delivery or database migration executed here. Test-only Maps live in the automated tests, never in runtime. No customer records or secrets are included.

**Hobby hosting**: Vercel currently disallows Git-deploying a private GitHub organization repository to a Hobby team. Keep the repository private now. Only the owner can authorise a future visibility change. Separately, Hobby is limited to non-commercial personal use: choose a suitable compliant hosting plan before selling Booking subscriptions or accepting money.

Before enabling live endpoints: provision independent Postgres, apply and audit migrations, implement secure adapter + durable mail retry/outbox, enforce signed origin/CSRF and application-wide distributed throttling, install verified Google OIDC, scope every query by workspace membership, finish email/terms/privacy and independent security audit.
