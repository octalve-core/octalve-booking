# Octalve Booking — Phase 15 authentication acceptance and release boundary

Date: 2026-10-22. Repository `octalve-core/octalve-booking`; source baseline `c1649f2d5ed46c59e36beb85ce1134569b58292a`.

## Implemented in this phase
- Existing personal/business signup retains mandatory name, verified-email flow, password and optional international E.164 phone; business metadata, website, timezone and currency are persisted at workspace creation.
- Session-backed `GET/PATCH /api/v1/auth/me`, owner-checked `PATCH /api/v1/auth/business`, and current-password-authenticated `POST /api/v1/auth/change-password`.
- Atomic password update compares the previously verified stored digest (race-safe), revokes **all** active sessions and writes an auth audit event in one database transaction; HTTP clears the current HttpOnly secure cookie.
- Existing one-use email verification and reset, transactionally encrypted outbox, Resend transport and protected outbox worker preserved.
- Responsive account security page at `/account/security`; pre-existing `/account` workspace route preserved; successful sign-in routes to security settings; removed misleading 'Remember me' control because sessions currently have a fixed seven-day maximum.
- Migration 009 adds optional workspace website and platform authority/audit tables; no business-role grants or policies to those tables. Platform privileges require a privileged administrator to provision separate policies and working MFA; ordinary signups never create platform membership.
- Google OIDC cryptographic state, PKCE, nonce and claims *preflight* guards, including an explicit anti-takeover linking rule. Google provider action remains disabled; no JWT claims are trusted until an approved signature/JWKS verifier is implemented.
- Auth role guard denies activation if the restricted login has privileges on Booking tenant/payment schemas or Octalve platform permission table.

## Acceptance criteria
- `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` must pass on the same commit.
- PostgreSQL 16 CI starts an ephemeral database, executes migrations **001–009**, requires FORCE RLS on all 29 service tables, checks the no-access platform table policy, then performs real signup → verification → login → personal/business profile update → password change → session revocation → reset → replay denial and cross-tenant workspace refusal through `booking_ci_identity`. No tests touch a real user database.
- Browser check traverses the existing native Booking UI, auth screens and page navigation with no backend request fabrication.
- Promote to `review/booking` after passing; keep `main` and `demo/booking` unchanged until real provisioning and independent UAT.

## External blockers: DO NOT claim B2 is operational
1. No dedicated production Booking PostgreSQL database or privileged migration operator is connected in this chat. Provision one and run reviewed migrations with a **migration-only** identity; create a separate least-privilege runtime login granted only `booking_identity_service`, with no BYPASSRLS or SUPERUSER.
2. No verified transactional sender domain, production Resend API key, SPF/DKIM verification, job scheduler or dispatch smoke test has been completed. Configure sender, external scheduler and exercise delivery plus retries and expiry on the chosen environment.
3. No independent production-origin / cross-site request verification / rate-limit abuse tests have run. App Origin must be actual canonical HTTPS. Network/IP-aware throttling, MFA, audit/monitoring, egress policies, backup restoration and incident response require a subsequent security qualification.
4. Google OAuth remains disabled until provider client creation, PKCE/session state storage, signature-verified JWKS, strict callback, provider subject linking, tested account recovery and consent are finished.
5. Business/team invitations and platform role provisioning are not activated; platform MFA is a **schema/preflight requirement**, not a deployed factor authenticator.
6. Existing booking, customer and payment submission routes remain 503; sales/subscription billing is a separate phase.

## Vercel environment keys (do not paste values in GitHub or chat)
- `BOOKING_APP_ORIGIN`: canonical HTTPS origin, e.g. `https://booking.example.com`, no slash.
- `DATABASE_URL`: Booking-only PostgreSQL TLS connection **as the restricted identity login**, not migration owner, no cross-product access.
- `AUTH_PASSWORD_PEPPER`: independent random server secret >=32 bytes UTF-8.
- `AUTH_MAIL_ENCRYPTION_KEY`: 32 random bytes in base64url (43 characters), independent of pepper.
- `AUTH_RATE_KEY_SECRET`: distinct >=32 byte random secret for HMAC limiter.
- `EMAIL_FROM`: verified company sender address.
- `RESEND_API_KEY`: private server-side API key.
- `AUTH_OUTBOX_CRON_SECRET`: independent >=32-byte worker bearer secret.
- `BOOKING_AUTH_ENABLED=0` until real integration and security acceptance.
- `BOOKING_SUBMISSIONS_ENABLED=0`, `BOOKING_PAYMENTS_ENABLED=0`, `BOOKING_NOTIFICATIONS_ENABLED=0` until their own phases are qualified.
- Optional, **not yet operational**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.

Keep secrets server-only; never use `NEXT_PUBLIC_` for credentials. Use isolated Demo and Preview databases and keys. Production `DATABASE_URL` with the migration owner's role is prohibited.

## Safe activation gate
Qualified Review code may merge into `main` only after actual provider environment integration, send/receive verification email, active session and membership enforcement, password/session revocation, negative CSRF tests, recovery rate-limits and backup/restore plus human visual acceptance. Simply setting `BOOKING_AUTH_ENABLED=1` is not sufficient evidence.

## Next
Provision/test the Booking-only database and Resend sender in Preview, complete the Phase 15 external integration gate, and only then advance to Phase 16: Octalve Owner control plane and subscription authority, preserving independent security and test data boundaries.
