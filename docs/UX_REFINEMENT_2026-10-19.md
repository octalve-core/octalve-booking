# Octalve Booking — UX refinement 19 Oct 2026

## Scope
UI-only refinement on `phase/01-booking-ux-refinement` into `review/booking`. Do not merge to `main` or activate real client intake until approved.

### Included
- Mobile: no off-canvas sidebar; Home, Bookings, Services, More, Account; More hub routes into Calendar, Enquiries, Clients, Payments, Integrations, Reports, Get started, Settings, Booking page.
- Finance-inspired soft-colour icon surfaces, mobile filters and stacked cards.
- Public booking: branded host sidebar, stepper, service choice, full monthly calendar, selectable time slots, timezone selector, intake and payment review. The availability grid and times are illustrative in explicit Preview only, not sourced from bookings.
- Availability: weekly hours and date overrides with editable browser-only state, not published to a merchant calendar.
- Integrations: dedicated detail view by provider, credentials/scopes checklist, connection guide and link to authoritative documentation. No insecure browser secret input. Provider status remains Not connected.
- Video format in service editor: Google Meet, Zoom, Microsoft Teams, phone, in person, custom.
- Authenticated meeting provisioning remains a backend task: Google Calendar event insertion with conferenceData.createRequest and conferenceDataVersion=1 after confirmed booking; Zoom User OAuth with approved meeting-write scopes, meeting create and renewal; Microsoft Graph/Teams meeting provisioning. Save unique provider meeting ID, join URL, revocation events and idempotent reference. Never fabricate a meeting URL.
- Official-style brand marks from Simple Icons (CC0) are copied locally for providers where verified source assets exist. Other providers retain neutral category icons pending licensed/official files. See https://github.com/simple-icons/simple-icons/blob/develop/LICENSE.md ; third-party marks are owned by their respective organisations.

### Explicitly not in this UI batch
- No real OAuth flow, Calendar/Zoom/Meet API call, appointment confirmation, webhook verification, persistence, secret storage, funds handling or real reminder sending.
- Public submission remains server-side `503`; Preview cannot collect bookings.
- No dependencies on Octalve Finance or Octalve EMR.

### Validation
- Local source/domain regression: 31 tests; JavaScript syntax.
- Browser viewport checks at 320/390/768/1440: More routing, availability settings, Zoom detail, 42-day date grid, time selection and intake route; no JS errors or page-width overflow.
- GitHub CI and Vercel build to be validated on the exact pushed commit; Vercel Preview only until owner inspection.

### Follow-on work
- Auth and tenant isolation, authoritative availability/holds; connection credential vault and OAuth callback endpoints, Google/Zoom conferencing adapters, calendar sync, real booking/payment state machine and jobs. These are independent product features and require provider credentials and integration approvals.
