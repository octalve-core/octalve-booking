# Octalve Booking — B2 PostgreSQL adapter and distributed rate limits

Status: **source implementation, not provisioned**. All public auth endpoints remain 503.

The server-only module `src/server/identity/postgres.ts` provides parameterised SQL implementations for the B2 `IdentityRepository`: transactional pending account/workspace/owner creation, one-use verification, sessions, password-reset atomics, and fail-closed session revocation. Its `PgPool` interface is deliberately injected, so it does not create a database connection or require secrets or a new package in this branch.

`db/migrations/002_booking_rate_limits.sql` adds durable throttling keyed by HMAC-SHA256 of event and discriminator (never raw email). An atomic PostgreSQL `ON CONFLICT ... DO UPDATE` increments the attempt count; the expiry window and policy are imposed by the adapter.

**Required hard gate**: migration 001 enables and FORCEs RLS for every identity table, and 002 does the same for rate limits. It grants no public access and defines no runtime access policies. The adapter therefore correctly fails closed until a deliberately designed, least-privilege runtime database role and vetted policies/SECURITY DEFINER entrypoints are provisioned. Do not disable RLS or grant BYPASSRLS merely to make tests green. This branch has no live database connection and **does not prove PostgreSQL integration correctness**.

Pending work: durable **atomic** encrypted email outbox, runtime DB provider, real network/database integration tests, trusted origin & CSRF, IP/network throttling, tenant authorization middleware, Google OIDC, team invitations and production security review. Existing service calls the mailer after committing the account; this is not fully crash-safe and must be replaced before activation. No email senders or live auth routes are enabled.

Private repo, separate Demo and no Vercel deployment remain binding release constraints.
