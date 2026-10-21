# Octalve Booking — B2 release consolidation and PostgreSQL migration gate

Phase 11 audit found the first migration had 2 COMMIT statements and 15 repeated table definitions. This was a source defect not caught by previously passing mocked database tests.

The migration was reconstructed up to its first correct COMMIT (8 unique identity tables), preserving the signed-off schema and E.164 constraint.

Added:
- Direct source structure checks for every migration.
- A GitHub Actions PostgreSQL 16 container: run migrations against an **actual ephemeral database**, assert exactly 10 identity/outbox/rate-limit tables, FORCE row-level security, deny public read, and reject invalid phone numbers.
- No customer database was provisioned and no live migrations or credentials were accessed.

Before release, only the tested commit may be fast-forwarded to `review/booking`, retested, then to `main` with explicit owner approval. Do not merge synthetic demo fixtures. All auth/bookings/integrations API endpoints remain fail-closed pending secure, independent infrastructure.

What is not tested: complete transaction flows against PostgreSQL with a scoped runtime access role and real secure mail provider; this remains a hard B2 activation requirement.
