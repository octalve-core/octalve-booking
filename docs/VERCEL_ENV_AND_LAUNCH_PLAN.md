# Octalve Booking — Production configuration and launch gates
## What is implemented
The public GitHub repository has a separately qualified Next.js 16 UI, real PostgreSQL 16 schema tests, isolated authentication and booking domain schema, timezone/DST validation, provider signature verification helpers and guarded migration contracts. These are **software foundations**, not working merchant, booking or email connections.

No authentic identity is yet stored, no customer can submit an actual booking, and no provider can mark an invoice/appointment paid. Current HTTP account endpoints intentionally return 503. Uploads, Google login, calendars and conferencing are not active. The UI still uses sample fixtures for Review/Demo.

## EXACT Vercel Environment Variables — when ready
Use **Project → Settings → Environment Variables** for Octalve Booking. Add these to Production only once the matching feature is implemented, then redeploy. Preview and Demo must have their OWN database and sender credentials.

| Key | Value / source | Readiness |
| --- | --- | --- |
| `BOOKING_APP_ORIGIN` | Exact HTTPS URL, e.g. `https://booking.example.com` without slash | Needed for canonical origin/CSRF |
| `DATABASE_URL` | Pooled, TLS-enabled PostgreSQL connection string for a **dedicated Booking database** (e.g. Neon) | Required for live data; not provisioned |
| `AUTH_PASSWORD_PEPPER` | Secret, random base64url string with at least 32 UTF-8 bytes | Needed for password hashing |
| `AUTH_MAIL_ENCRYPTION_KEY` | 32 random bytes encoded as 43-character base64url | Encrypted verification/reset outbox |
| `AUTH_RATE_KEY_SECRET` | Separate random secret ≥32 UTF-8 bytes | Shared limiter HMAC |
| `EMAIL_FROM` | Verified sender such as `Octalve Booking <no-reply@your-domain>` | Pending email DNS verification |
| `RESEND_API_KEY` | API key obtained in your own transactional-mail dashboard | No provider connected |
| `AUTH_OUTBOX_CRON_SECRET` | Separate long random secret for a future authenticated cron worker | Worker not deployed |
| `BOOKING_AUTH_ENABLED` | `0` until login, verification and session endpoints are qualified | Keep **0** |
| `BOOKING_SUBMISSIONS_ENABLED` | `0` until atomic hold/availability and booking APIs are qualified | Keep **0** |
| `BOOKING_PAYMENTS_ENABLED` | `0` until gateway callbacks and server re-verification are qualified | Keep **0** |
| `BOOKING_NOTIFICATIONS_ENABLED` | `0` until delivery workers and consent rules are qualified | Keep **0** |

The four flags are defensive configuration intentions; they do not automatically activate an endpoint. **Adding variables alone will not make customer sign-up or bookings work**.

Optional Google credentials, only after OIDC code and Google Cloud consent/callback setup: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`. Payment credentials, only for your chosen and approved provider: `PAYSTACK_SECRET_KEY`, `FLUTTERWAVE_SECRET_KEY`, `FLUTTERWAVE_WEBHOOK_SECRET`, `MONNIFY_API_KEY`, `MONNIFY_CLIENT_SECRET`, `MONNIFY_CONTRACT_CODE`. Calendar/meeting credentials are optional and must not be set before actual connection handlers are reviewed.

**Generate secrets on your own machine, not in this chat or a source commit:**
```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```
Generate separate values for pepper, rate-key, mail-encryption and cron. Never reuse the same value. Use the **32-byte** command for `AUTH_MAIL_ENCRYPTION_KEY`.

## What must happen before turning on each feature
1. **B2:** Connect a Booking-only PostgreSQL service; run approved migrations 001–006 via a separate migration identity; verify a limited DB runtime role and RLS policies; add an actual Postgres driver, mail provider, worker, origin/CSRF checks, server route handlers and non-enumerating responses. Prove signup → email verified → cookie session → tenant workspace → password reset and revocation. Google OIDC and invitations next.
2. **B3:** Wire services, staff hours/date overrides, public slot generation, atomic hold creation, expiry, cancellation and rescheduling into secure route handlers. A GiST exclusion constraint blocks overlapping staff claims, but expired holds require cleanup on each hold attempt. Test two concurrent requests, timezone transitions and compensation if gateway confirmation arrives after hold expiry.
3. **B4:** Add separate sandbox credentials and provider callback URLs. Verify signatures against **raw** request bodies; store events idempotently; independently verify reference, amount, currency, merchant/intent ownership and settled status before confirming; manual bank transfers require authorised review. Refunds use provider-verified lifecycle, not client screenshots.
4. **B5:** Implement per-workspace OAuth with encrypted refresh tokens and consent; calendar conflict check, async email/video provision with retries, accurate delivery state, reminder unsubscribe and dry-run CSV/ICS imports. Never import real records or accept raw provider credentials from anonymous browsers.
5. **B6:** Choose compliant commercial hosting, verify a custom domain, backups/PITR, retention/deletion policy, privacy/terms, observability, staff audit, provider risk checks and independent acceptance. Keep an isolated public Demo environment with synthetic records.

## Deployment process
- Pushes to GitHub do not guarantee a Vercel deployment; verify the commit and domain in the actual Vercel project.
- Select Next.js framework, root `./`, `pnpm install --frozen-lockfile`, `pnpm build`, Node 24, and Production branch `main`.
- **Never put real credentials in `NEXT_PUBLIC_*`, `.env.example`, GitHub commits, screenshots or chat.**
- Environment variables do NOT initialise tables. Apply migrations with an approved privileged migration role, then test least-privilege runtime access.
- Current Vercel Hobby is limited to personal/non-commercial use. Commercial bookings/subscriptions require suitable hosting.
- Do not use Demo database credentials in Production, nor merge `demo/booking` into `main`.

## Provider references
Official docs: https://paystack.com/docs/payments/webhooks/ , https://developer.flutterwave.com/docs/webhooks , https://vercel.com/docs/plans/hobby , https://vercel.com/marketplace/neon
