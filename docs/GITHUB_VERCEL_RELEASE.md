# Octalve Booking — isolated review-first release

- `main`: released and approved application only. Never deploy this README-only initial baseline.
- `phase/00-booking-shell`: first Booking application source. Its bootstrap job generates the pinned `pnpm-lock.yaml` via GitHub Actions. If Actions cannot push because of organisation settings, use the uploaded lockfile artifact for manual review and commit.
- `review/booking`: only from the exact qualified development commit after the lockfile is committed. GitHub CI uses frozen install, tests, TypeScript check, ESLint and Next production build. Vercel Preview builds this branch.
- `main`: advance after reviewing the actual Preview, verifying permissions and safety, and owner approval. Do not merge blindly.

The current initial release is an interface shell. Backend routes deliberately fail closed; payments, real bookings, calendar OAuth, WhatsApp and SMS are **not connected**. No patient information, secrets, financial transactions or real booking intake data should be entered.

## Independence
This repository has no build/runtime links to Octalve Finance or EMR. Do not introduce cross-product database, auth or payment coupling. The stylesheet design uses locally owned assets and self-contained layouts.

## Vercel
Independent project `octalve-booking` under Octalve Vault team. Keep the `phase/**` deployment suppression; use a single review branch release to limit builds. Review must be access-protected. `main` production must remain unchanged until owner approval.
