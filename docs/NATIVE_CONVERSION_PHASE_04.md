# Octalve Booking — native Next.js conversion

## Pin
Original accepted interface, GitHub main: `39fecd3a5b4e06e934ff7f3ece40f53d49be73eb` (19 October 2026). This source commit is immutable and the comparison baseline. Conversion is carried out on `phase/04-native-nextjs-conversion`; do not change main until review acceptance.

## Native application
- Next.js 16+ App Router; React 19 client components where interactivity is required.
- Strict TypeScript, shared typed booking/service/client/enquiry interfaces, Tailwind CSS 4, local icons/assets.
- Separate Next.js routes for all workspace modules, record details/editing, service creation and provider requirements.
- Desktop fixed dark sidebar with restrained white surfaces; mobile five-item navigation and bottom action sheets.
- Explicit `?preview=1` to load fictional *session-only* example records. Regular workspace contains no fake payments or bookings. No provider API, credential, email or patient data is accepted through this frontend.
- Public booking page is a calendar-based **illustration** and does not submit live requests or make up valid slots. Payment verification, transfer review, atomic holds and tenant security remain later backend phases.
- Legacy `public/booking.js` and `public/booking.css` are retained as pinned visual references during the conversion, but are not loaded or executed by the native Next.js app. They are to be removed only after interaction parity is accepted. The old catch-all page is removed now.

## Migration acceptance and open gaps
- [x] Native workspace navigation; desktop/mobile shell; React components and TypeScript models.
- [x] Native bookings/client/enquiry/service record pages and session-only edit flows.
- [x] Native integration catalogue, provider requirement screens and public booking calendar.
- [x] Typed service `₦0` and manual bank review context; backend submissions remain disabled.
- [ ] Feature parity for date overrides, detailed setup workflows and advanced booking policies.
- [ ] Full browser behaviour and accessibility matrix across all routes.
- [ ] Build, typecheck, lint and visual screenshot comparison on exact branch commit.
- [ ] Replace fragile legacy source tests with React component/browser tests (initial native structural tests already added).
- [ ] Remove legacy scripts and duplicate CSS after owner visually approves parity.
- [ ] Authoritative auth, persistence, gateway webhooks, calendar and WhatsApp integrations remain Phase C+ and are not part of this conversion.

## Release
Generate updated `pnpm-lock.yaml` in CI through the native lockfile workflow, qualify frozen dependencies, TypeScript, lint and Next.js build; then update `review/booking` for a protected Vercel Preview. Do not merge or promote to main without complete parity and owner approval.
