# Octalve Booking — B2 identity, tenancy and secure-auth foundation

State: **Foundation only. Not enabled for customer accounts.**

## Implemented in this batch
- An independent PostgreSQL migration in `db/migrations/001_booking_auth.sql`: users, workspaces, memberships, sessions, one-time tokens, Google subject mapping, invitations and audit events.
- Deny-by-default row-level security on each identity table. No application connection or privileged bypass exists in this repository.
- Password hashing and verification via keyed SHA-256 prehash + memory-hard Node.js scrypt, a fresh random per-user salt, constant-time verification, and versioned stored format.
- Purpose-separated 256-bit random tokens, SHA-256 token digests only, secure session-cookie defaults.
- Server-side role/membership access checks that require verified active users and matching active workspace memberships.
- Registration input parsing rejects user-supplied role or verified/admin status; validates E.164 and HTTPS URL input.
- All account write/identity endpoints answer 503 with no-store until infrastructure is properly configured.
- Automated tests for security primitives and source boundaries.

## Explicitly NOT done
- No database provisioning, migration execution or privileged connection. No real user registrations, Google OAuth logins, email sends, password resets or sessions.
- Not yet implementing signup/login handlers backed by transactions, email verification, anti-automation/rate limits and OTP lifecycle.
- No production workspace access bypass or fake server-generated confirmation.
- No direct Finance or EMR dependencies or reuse.

## Required before B2 acceptance
1. Select and provision an independent managed Postgres instance for Octalve Booking, ideally with separate migration credentials and runtime role.
2. Audit and apply migrations; control privileges and tighten RLS or use a trusted policy-enforcing data access layer.
3. Configure a verified sender and transactional email delivery (verification/reset/invite), ensure generic responses and low-abuse rates.
4. Implement DB-backed account creation: unique email, password hashing, pending verification, expiry and one-time token consumption transaction.
5. Implement HTTP-only secure session cookies backed by hashed sessions, rotation and revocation; protect data access and mutations using workspaceId and membership checks.
6. Add Google OIDC only with real client credentials, PKCE/state/nonce, verified issuer/audience and safe account-linking.
7. Add staff invitation and ownership transfer with re-auth, role restrictions and append-only audit events.
8. Add privacy notices, data retention, account deletion, security headers, CSRF protections and request throttling.
9. Full CI, dependency audit, independent security tests and Vercel private Git project linkage check. Do not enable account submit buttons prematurely.

## Policy note
Session cookies follow Next.js 16 server-only cookie controls; use `await cookies()` in Route Handlers. Password design follows NIST SP 800-63B minimum passphrase guidance and stores only a salted, memory-hard digest; 15-character sign-up UI alignment is a separate future step.
