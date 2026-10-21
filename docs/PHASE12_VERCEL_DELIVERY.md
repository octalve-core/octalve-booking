# Octalve Booking — Phase 12 delivery and Vercel release checklist

## Verified scope
- Repository is public; **no secrets have been committed**.
- Node 24, Next.js 16.2.6, React 19, TypeScript, Tailwind 4, pnpm 10.18.3.
- PostgreSQL identity (001–003, 007), slot/exclusion (004), payment authority (005), and integrations (006) SQL migrations tested in PostgreSQL 16 CI.
- Sign-in/sign-up/reset UI uses the real server endpoints only after a guarded status check; the browser-only demo remains separate.
- The identity runtime requires valid environment variables **and** a trusted, non-superuser, non-BYPASSRLS database login with membership in `booking_identity_service`, plus all 10 identity RLS policies.
- Email outbox worker is an authenticated POST endpoint and uses Resend with idempotency keys.

## What is deliberately NOT enabled
- Actual paid bookings: `/api/v1/bookings` still returns 503; availability, holds and payment settlement are not connected to a public booking API.
- Paystack, Flutterwave and Monnify: signature and settlement predicate code exists, but merchant onboarding, transaction verify API and live webhooks are not wired.
- Google OIDC, Microsoft/Google calendars, Zoom/Teams/WhatsApp: no authorised provider OAuth grants or tokens yet.
- Business/team invitations and staff access UI are not yet connected to the server.
- Reminders and CSV/ICS migrations are not yet executed; input validation and staging schemas only.
- Legal terms, privacy policy, backup/restore, incident monitoring and commercial hosting acceptance are not approved.

## Deployment procedure
1. In Vercel choose project `octalve-booking` (or connect `octalve-core/octalve-booking`); set Framework `Next.js`, root `./`, Production branch `main`, install `pnpm install --frozen-lockfile`, build `pnpm build`, Node `24.x`. Do not infer project URL from a dashboard link.
2. Use a **dedicated Booking PostgreSQL project**. With an administrative migration identity (never put it in Vercel app env), apply SQL migrations 001–007 in filename order, then create a separate minimal `booking_app_login` with a unique password and `GRANT booking_identity_service TO booking_app_login;`. Ensure it has no superuser or BYPASSRLS rights and no access to `booking_core`, `booking_payments`, `booking_integrations`. Confirm the `DATABASE_URL` logs in as that role.
3. In Vercel Project → Settings → Environment Variables add the keys below; use **Production** for production credentials. Preview and Demo must have independent origins, databases and email credentials if activated.
4. Verify the sender domain and SPF/DKIM with the chosen transactional email provider; do not send from an unverified address.
5. The mail worker is `POST /api/internal/mail-outbox`, with `Authorization: Bearer <AUTH_OUTBOX_CRON_SECRET>`. It is not automatically scheduled. A trusted external scheduler or a plan allowing appropriately frequent cron is required. The worker must never be directly public without its bearer secret.
6. Keep feature flags `0` until external integration tests, registration-email-verification-session tests, backup restoration, security review and business/legal checks are complete.
7. Confirm the Git commit and domain actually served by Vercel, then perform real user acceptance with separate test accounts, never synthetic records in a live customer workspace.

## Vercel environment variables

| Key | Exact expected value format | Provisioning |
| --- | --- | --- |
| `BOOKING_APP_ORIGIN` | Actual canonical site HTTPS origin, e.g. `https://YOUR-BOOKING-DOMAIN` with **no trailing slash** | Required for CSRF validation |
| `DATABASE_URL` | Restricted Postgres connection URI as `booking_app_login`, with `sslmode=verify-full` | Required only to activate B2 |
| `AUTH_PASSWORD_PEPPER` | Independent server-generated random secret, at least 32 bytes | Required for password hashing |
| `AUTH_MAIL_ENCRYPTION_KEY` | 32 random bytes, base64url encoded (43 characters) | Required for encrypted outbox |
| `AUTH_RATE_KEY_SECRET` | Distinct random secret, at least 32 bytes | Required for durable rate limiter |
| `EMAIL_FROM` | Verified sender address, e.g. `Octalve Booking <no-reply@YOUR-DOMAIN>` | Required for email |
| `RESEND_API_KEY` | Secret key from Resend Dashboard | Required for auth email delivery |
| `AUTH_OUTBOX_CRON_SECRET` | Separate long random bearer secret | Required for protected worker |
| `BOOKING_AUTH_ENABLED` | `0` initially; change to `1` **only** after B2 external security qualification | Leave off now |
| `BOOKING_SUBMISSIONS_ENABLED` | `0` until actual transactional booking APIs and tenant isolation are qualified | Leave off |
| `BOOKING_PAYMENTS_ENABLED` | `0` until independently provider-verified payment handling is qualified | Leave off |
| `BOOKING_NOTIFICATIONS_ENABLED` | `0` until delivery worker, consent and reminders are qualified | Leave off |

Optional provider keys **must not be enabled yet**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `PAYSTACK_SECRET_KEY`, `FLUTTERWAVE_SECRET_KEY`, `FLUTTERWAVE_WEBHOOK_SECRET`, `MONNIFY_API_KEY`, `MONNIFY_CLIENT_SECRET`, `MONNIFY_CONTRACT_CODE`, `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`, `MICROSOFT_ENTRA_CLIENT_ID`, `MICROSOFT_ENTRA_CLIENT_SECRET`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`.

Generate four independent random secrets locally (PowerShell/Node 24):
```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```
Generate the 48-byte command separately for pepper, rate key and cron. Use the 32-byte command only for the mail-encryption key. Never paste generated values in this conversation or commit them to GitHub.

**Do not add** a privileged migration URL, real test IDs, webhook payloads, personal data or any secret under a `NEXT_PUBLIC_` prefix. Do not assume `NEXTAUTH_SECRET` is required: this project is not using NextAuth.

## External launch gates
- A PostgreSQL CI container proves the migrations run, **not** that your chosen managed DB is connected, backed up, properly isolated or suitably performant.
- Vercel Hobby is for personal/non-commercial usage and its cron interval is at most once per day. Paid SaaS and near-time reminders require a compliant commercial plan or other suitable hosting/scheduler.
- Google login needs properly validated issuer/audience/nonce/state/PKCE and consent configuration.
- Payment confirmation needs a completed independently verified provider transaction, not merely a signed webhook or return URL.
- Production readiness is not established by environment variables alone.
