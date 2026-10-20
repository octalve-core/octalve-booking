# Octalve Booking

Independent appointment, enquiry, availability and provider-integration platform for businesses and individuals.

## Native conversion underway (Phase 04)

The **application is being rewritten in Next.js 16 App Router, React 19, strict TypeScript and Tailwind CSS 4**. The work is on `phase/04-native-nextjs-conversion`. The previous accepted interface is pinned to commit `39fecd3a5b4e06e934ff7f3ece40f53d49be73eb` as a visual and behavioural reference; production `main` remains on that version until parity is reviewed.

The native branch has dedicated routes and typed React components for workspace, bookings, services, calendar, enquiries, clients, payments, integrations, reports, settings and a public booking experience. Illustrative records are enabled only with `?preview=1`, remain in-memory and do **not** initiate real booking, messaging, payment or calendar operations.

The former `public/booking.js` and CSS remain only as **unloaded migration references**, pending final parity checks and removal. They are **not** the rendering engine for the native branch.

## Run checks

Node 24; pnpm 10.18.3. Run `pnpm install --frozen-lockfile`, `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`. GitHub Actions qualifies the same commands.

See `docs/NATIVE_CONVERSION_PHASE_04.md` for completed milestones, open gaps, review and release gates.

## Security boundary

Standalone source, customer storage, authentication and deployments. No runtime dependency on Octalve Finance or EMR. Provider credentials belong exclusively in verified server-side integration flows. Booking/payment endpoints remain disabled until backend authority is implemented.
