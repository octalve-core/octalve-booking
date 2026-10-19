# Octalve Booking — Phase A/B Verification Checkpoint

Updated: 19 October 2026. This document records *actual* capabilities, not provider connection promises.

## Source status
- Finance-inspired responsive Booking interface: assembled locally.
- Local offline interface review: `preview.html`, with an explicitly enabled, in-memory fictitious dataset.
- Standalone self-contained review: `Octalve-Booking-Standalone-Preview.html`, with examples enabled only when opened as a local file.
- Hosted application: empty workspace metrics and no fictitious bookings. Public booking page must not advertise unverified slots or accept submissions.
- Business-specific real records, provider connections, authentication, calendars and payment processing: not implemented. All booking/integration HTTP submission endpoints deliberately fail closed.
- Free booking state uses `HELD_FREE` and now requires a transient hold and atomic availability validation; price zero alone is never authoritative confirmation.
- Unimplemented integrations remain labelled Not connected.

## Phase status
A: Requirements and provider research done as a preliminary specification; several provider eligibility and policy decisions remain open.
B: UI source, routes, workflows, responsive static QA, domain rules and safety adjustments complete locally; full Next.js build **unverified** until pnpm lockfile/install/CI qualification.
C: Not started. Identity/tenancy/database service and secure secret management are required.
D: Not started. Conflict-safe holds, payment webhooks, bank review authority.
E: Not started. Provider transport adapters, messaging delivery jobs and migration persistence.
F: Not started. Security/recovery tests, owner signoff and production release.

## Delivery controls
1. Do not assume public repository exists/connected: GitHub App currently cannot find `octalve-core/octalve-booking` (NOT_FOUND).
2. Initialise standalone repository and create `phase/00-booking-shell` only after checking access and history.
3. Generate and check in `pnpm-lock.yaml` on a connected workstation. Run install, unit tests, TypeScript, lint, build and mobile browser regression.
4. Push to development, advance exact qualified SHA to `review/booking`, inspect preview and only then approve main/production.
5. Do not enable public paid booking, provider key entry, personal data collection or unprotected share links until the backend and privacy/security gates pass.

## Independence
No code, network, storage or data imports from Octalve Finance/EMR; optional integrations later only through independently authorised external APIs.

## Audit evidence
- The source/domain suite passed **28 tests** after syncing Next and standalone CSS.
- Local browser review: **8 cases** covering widths 320/390/768/1440px in each review-data and customer-safe empty mode. No JavaScript errors or document overflow.
- Full `pnpm typecheck`, `pnpm lint`, `pnpm build` cannot run here because npm registry access fails with `EAI_AGAIN`. A connected workstation / GitHub Actions is the required build qualifier.
