# Phase 05 — independent native Booking UI parity, bounded review

## Release boundary
Development branch: phase/05-booking-ui-parity-accessibility, from verified main fa8f91217c889fd62c8059b5580bffef3afc51f1. Main and Production MUST NOT change until explicit owner sign-off. No Finance/EMR runtime imports, shared credentials, database, deployment or payment authority.

## Native UI work in this batch
- Calendar: weekly windows, date closures, custom date intervals, timezone selection, buffers, notice and advance windows; overlapping windows, duplicate/invalid dates and invalid numeric boundaries are rejected.
- Service editor: accessible duration/price/payment policies (free, deposit, full prepayment, paid pay-later), publication-example toggle, service-specific intake questions with type/required/help, order/remove, and scheduling safeguards.
- Illustrative public booking: read-only fixture service-specific intake controls. Submission remains disabled; example slots are NEVER live availability.
- Dedicated provider setup: transparent unconnected statuses, requirements and security/health guidance, merchant-bank/email/Teams coverage, local-only CSV/ICS selection with no actual ingestion.
- Get Started: sequenced linked setup tasks, clearly separating session example state from verified readiness.
- Quick Create: no longer advertises new-client creation where no dedicated create workflow exists.
- Accessibility/regression: keyboard Escape/focus tests for mobile action sheets, 320/390/768/1440 overflow checks, extended single recorded browser-only walkthrough from root with visible links, typing and local file selection.

## Explicitly not done
- Persisted tenant/user auth, owner/staff roles, invitations, MFA, keys/OAuth.
- PostgreSQL migrations and atomic booking holds/overlap constraints/expiry workers.
- Gateway signed verification, corporate-bank credit review, partial accounting and refunds.
- Actual calendar sync/meeting links, WhatsApp/email/SMS sends, real migration import or file upload.
- Public booking publication or customer form submission.
- Legacy HTML/CSS/JS reference removal (requires all-routes parity acceptance).
- Entire all-routes WCAG audit and all advanced booking policy screens. These remain next UI gates.

## Acceptance gates before Review
1. GitHub source and native qualification at the EXACT final branch commit must succeed: frozen pnpm, node tests, TypeScript, ESLint, full Next build.
2. Review browser CI must succeed at 320/390/768/1440, with single uninterrupted Playwright video and no direct deep-route jumps/API calls in that recording.
3. Verify Vercel Preview commit, protection and READY state using authorised team access; if inaccessible, do not assert it passed.
4. Owner inspects Preview; only then approve main/Production release.

## Critical authority note
Example stores are browser-memory-only when preview=1; regular workspace refuses mutation. Source APIs return 503. No verified booking, payment, meeting or notification state may be inferred from these screens.
