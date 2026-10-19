# Independence, source provenance and security boundaries

The business owner requested the **Octalve Finance aesthetic** (dark fixed sidebar, blue active navigation, desktop separated rows, compact mobile stacked cards) as a design reference. This independent Booking implementation reproduces the design *patterns* without importing Finance React components, merchant state, payment logic or database code. The Booking brandmark is authored locally. No font file is copied or bundled.

- Repo destination: `octalve-core/octalve-booking`; separate release pipelines, secrets, packages, customer data, subscriptions and environments.
- Brand and UI look similar across products. At runtime no calls, imports, shared DB strings, or infrastructure dependencies on `octalve-invoice` or `octalve-emr`.
- Optional cross-product integration is a separately authenticated, revocable business configuration in a later phase. A provider outage must not block core standalone scheduling.
- Public booking forms never call live services in this phase; the secure HTTP booking route returns `503` and the UI does not assert that it sent a request.
- Backend authority modules will own availability, holds, confirmation and payment truth. **Never** infer these from local JS states.
- The included example data is illustrative and should not be understood as legitimate payments/bookings. No live clinic or legal case data should be entered.
- External services integrations currently show connection requirements only; not actual connected accounts. Secrets must be provided only after secure owner-authenticated backend connection flow with encryption, redacted logs and rotation controls exists.

### First production implementation gates
1. Enforce org membership and role checks server-side; protect routes and storage.
2. Implement PostgreSQL exclusion constraints and TTL cleanup/rebooking transactions; concurrent booking tests.
3. Implement provider adapters, independently verified webhooks and ledger-safe settlement events.
4. Implement merchant corporate-account validation and staffed review protocol with deadline and step-up authentication.
5. Implement tenant-safe encrypted OAuth/token storage, calendar-sync health and durable notification queues.
6. Implement opt-in policy and privacy/NDPA compliance controls.
7. Run full Next.js build and dependency audit (not possible in the current offline artifact environment).
8. Only then enable final submission and publish actual customer booking links.

### Review branch convention
`phase/00-booking-shell` → GitHub CI → `review/booking` Preview → **owner sign-off** → `main` Production. Disable automated Vercel builds for `phase/**` to conserve Hobby quota. Never merge to `main` without verified build and explicit owner approval.
