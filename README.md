# Octalve Booking

An independent, mobile-first booking and enquiry scheduling product for businesses and individuals. Styling follows Octalve visual conventions while the source, API, database authority, auth and deployments remain completely independent of Octalve Finance and EMR.

## Application foundation
Responsive Booking shell; service management including free (`₦0`) appointments, intake enquiries, availability and calendar planning, messaging/payment integrations catalogue, manual merchant-bank review concepts, migrations and a public booking journey. The visual interface does **not** implement authoritative real bookings or provider integrations. All server write endpoints fail closed until secure backend services are built.

## Development
Node 24; pnpm 10.18.3. Run `pnpm install`, `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm dev`.

The development phase initially generates its dependency lockfile through a GitHub Actions bootstrap. See [release instructions](docs/GITHUB_VERCEL_RELEASE.md).

## Product architecture
- `docs/PRODUCT_REQUIREMENTS_v0.3.md`: product requirements
- `docs/PROVIDER_RESEARCH_2026-10-19.md`: provider constraints
- `docs/ENGINEERING_BOUNDARIES.md`: authority and security boundaries
- `prisma/authority_schema.sql`: reviewed proposal only, not applied
- `src/domain.mjs`: booking/payment state contract
- `tests/`: booking policy and safe-client tests

No runtime imports of Octalve Finance or EMR. Client account data, payment credentials and calendar tokens must not be placed in this frontend.
