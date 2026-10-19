# Octalve Booking — Record and Client Workflow Refinement (19 October 2026)

## Scope

- Bookings: the desktop three-dot action menu now exposes view, edit, reschedule, add note, client profile and cancel/decline.
- Clicking a booking row opens an inner-page booking record rather than a read-only modal.
- Clients: dedicated directory, individual client record, enquiry history, booking links, follow-up stage and internal notes.
- Mobile: Finance-style bottom sheets for existing dialogs and new booking action/edit/cancel dialogs. Keyboard Escape/Tab controls for dialog focus.
- Records link through browser navigation with internal Back controls. Client follow-ups and appointments are accessible through the app shell, not requiring direct deep links.
- Page updates remain in the browser session only. There is no integration to backend database, email/SMS, calendar, provider verification or payment authority. Payment transfer review stays informational/blocked.
- Booking/date conflict checking here is illustrative only, not an authoritative hold. Backend Phase C needs database-level overlap constraints and payment-backed confirmation before real booking submission.
- No Finance or EMR imports. Source and release remain independent.

## Research and usability reference

Calendly Help (2026): [How to manage your meetings](https://calendly.com/help/how-to-manage-your-meetings) covers meeting detail, notes, reschedule, cancellation and no-shows.
Cal.com Help (2026): [Reschedule booking](https://cal.supportpages.io/managing-bookings/how-to-reschedule-a-booking) and [Cancel booking](https://cal.supportpages.io/managing-bookings/how-to-cancel-a-booking) use actions menus, reason requirements and appropriate status restrictions.
W3C: [Modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) specifies focus containment, Escape and return focus.

## Honest status and next iteration

- UI interaction fidelity and responsive browser review can be tested now with example records under `?preview=1`.
- Changes are not persisted, delivered or available to real customers.
- Missing: authenticated workspace, durable bookings and clients, permissions/audit, real calendar conflict checks, server-enforced rescheduling windows, refunds, client notifications and no-show automation.
- Review first: keep branch `review/booking` separate from production main until owner approval.