# Phase 03 final UI acceptance and walkthrough

- The previous review-only enquiry, dashboard and account corrections remain in place.
- Added a distinct Availability / Custom hours editor: weekday toggles, up to three time windows per day, date overrides, removal and validation of start/end ordering. Changes exist only during the current browser session.
- Browser checks at 320, 390, 768 and 1440px confirm editable hours, date overrides, enquiry actions, account navigation and no page-width overflow or JavaScript errors.
- One continuous screen recording follows 54 visible browser steps after local fixture loading. No direct page jumps, database manipulation or external API actions during the recording. Local fixture, **not live-site recording**, due restricted network navigation.
- The API for live bookings and payments remains fail-closed and must not be represented as complete. Auth, persistence, provider OAuth, bank transfer settlement and external messaging are later phases.
- Production promotion is authorised by the owner after CI and Vercel Preview qualification. Fast-forward only. Confirm exact SHA for `main` and Production before completion.
