# Octalve Booking Demo branch

Branch: `demo/booking`. This branch is deliberately independent from production `main` and contains only synthetic UI fixtures.

- 12 fictional clients, 23 sample bookings, 8 services and 10 enquiries.
- All email addresses use the reserved `.invalid` domain and phone numbers are obvious dummy samples.
- Demo fixture data is stored in `src/booking/fixtures.ts`. Browser edits are session-scoped only.
- `components/layout/WorkspaceShell.tsx` forces demo state so reviewers need no special `?preview=1` URL.
- Public `/b/octalve-studio` renders the customer-facing demo journey without a preview parameter.
- There are no successful real booking submissions, payments, provider connections, notifications or meeting provisioning.
- The default Production `main` branch does not contain the Demo-only fixtures, branding or forced demo state.
- The GitHub browser CI runs a single click-driven Demo walkthrough without recording or direct internal jumps.
