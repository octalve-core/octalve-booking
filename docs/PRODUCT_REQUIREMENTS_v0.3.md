# Octalve Booking — Product Requirements & Execution Specification v0.3
**Date:** 19 October 2026 · **Scope:** Standalone Octalve Booking · **Decision state:** User-approved directions captured; provider eligibility and full backend operations require qualification.

## 1. Product vision
Octalve Booking gives **businesses and individuals** a clear branded page to receive enquiries, offer appointments and protect their time. The core journey is **enquiry → choice of service → available slot → client context → applicable payment/approval → reliable confirmation → reminders → attendance/follow-up**.

Octalve Booking has its own database, authentication, domain, customer permissions, payment connection authority and deployment lifecycle. It does not import Finance or EMR code, secrets, customers, subscriptions, or clinical data. Future optional connections use separately authorised, revocable APIs and least-privilege access.

### Key outcomes
- A solo practitioner or small firm launches a shareable booking page without specialist technical help.
- Clients can find free consultations (`NGN 0`) without any payment step.
- Paid service bookings can require full advance payment, deposits, or later payment under an explicit merchant policy.
- A merchant can use a connected gateway **or** a separately configured normal company bank account.
- The UI never describes unverified bank claims as paid or unapproved appointments as confirmed.
- Local-first mobile experience: polished desktop tables and mobile record cards without horizontal table scrolling.
- Calendly or Cal.com users can move to Octalve through supported CSV/iCalendar import and reviewed mapping, without assuming undisclosed API access.
- Merchants can choose their calendar and communications integrations, including no external calendar and email-only service if they prefer.

## 2. Personas and jobs to be done
1. **Individual practitioner:** wants 1-to-1 links, free intro meeting, personal brand and privacy.
2. **Professional service firm:** wants qualifying questions, meeting goals, budget/timeline, paid discovery and controlled policies.
3. **Appointment-led business:** needs staff/resource scheduling later; deliberately not full MVP scope.
4. **Client/invitee:** books quickly from mobile, never needs an account, understands payment and status clearly.
5. **Merchant operations reviewer:** checks claimed transfers against actual bank records and reviews before deadline.

## 3. Navigation and responsive experience
Desktop: **Overview / Bookings / Calendar / Services / Enquiries / Clients / Payments / Integrations / Reports**, plus **Get started / Settings**. Fixed independently scrolling sidebar `#000A16`, active blue `#0064E0`, generous content padding and light rounded table rows. On mobile: **Home / Bookings / Services / More / Settings** bottom tab bar; no horizontal table scrolling; record cards display essential information, status and actions, with detailed view on tap. Public booking flow must fit 320px wide screens, accessible controls and appropriate timezone labels.

The customer-facing copy is concise and business-like. A workspace can present its brand and legitimate configuration status; it must never present a fake connected payment gateway, send fictional payment notifications or claim an appointment was created unless the backend confirmed it.

## 4. Service/event model
Service has immutable ID, unique business scoped slug, title, description, duration, meeting mode (online/phone/address), buffers, min notice, max advance, availability schedule, price in **integer minor units**, currency, `upfrontPercent` and a published version. `priceMinor=0` = free. Price and deposit fields are validated; publishing an adjusted price only affects future bookings. Booking keeps the service price/rules **snapshot**.

Rules: if `dueNow=0`, no payment request is made. For a paid service with a true pay-later policy, explicit confirmation policy must be recorded separately from a *free* service. Do not infer successful payment merely from zero due now.

## 5. Enquiry and intake
Every service can select or adapt an intake form. Business-relevant templates:
- **Consultancy:** business type, challenge, goal, project timeline, estimated budget, stakeholders.
- **Creative agency:** deliverables, audience, brand assets, style references, budget, due date.
- **Legal consultation:** practice area, urgency and general goal. Avoid default collection of confidential case files until secure policy is established.
- **Coaching/personal:** main objective, preferred format, desired outcome. Avoid excessive sensitive information.
- **Sales:** organisation, team size, purchase stage, decision timeline.
The form builder supports labels, help text, required flags, field types, order, conditions (later), saved version snapshot and optional attachment under security controls (later). Screening/routing decisions must be explainable and not infer protected characteristics.

## 6. Public booking journey and user-facing states
1. Open merchant booking link (no customer login).
2. Select a bookable service. Display **Free** if price is ₦0; otherwise show exact price/deposit and cancellation terms.
3. View availability after timezone conversion (IANA, UTC storage). Prevent selection if calendar health is insufficient under business policy.
4. Acquire an atomic, **expiring hold**, enforcing occupied intervals at database level. Do not lock the slot just because the customer opened a date picker.
5. Collect minimum identity and service-specific enquiry answers.
6. Choose an allowed payment channel or free path. Show **Awaiting payment** for unverified gateway; **Awaiting payment review** for merchant bank transfer.
7. Confirm only when payment/authority rules pass and the slot remains conflict-free. Queue signed confirmation, calendar entry and selected reminders.
8. Enable securely tokenised rescheduling/cancellation with policies, audit and financial exception tracking.

**Bank-transfer interpretation:** “Half-reserve” is a *short provisional review hold*, not a guaranteed appointment. Suggested default is 20 minutes, configurable within a 10–30 minute maximum range following pilot testing. The client sees clear deadline and **Not confirmed**. Only approved bank evidence can change status; merchant must complete second-factor confirmation on privileged action. Once hold expires, re-check availability. Never auto-approve because the customer uploaded a screenshot. If already occupied, do not double book; open an exception/refund or alternate-slot process.

**Paid gateway hold:** Suggested 12-minute limit; provider must verify actual success via authenticated event and separate status verification including amount, currency, merchant, event ID and idempotency. Late payment after an expired hold enters reconciliation; no automatic forced slot.

**Free consultation:** No gateway needed; safe direct confirmation after conflict-free hold/booking transaction when the venue and host policies permit. Can add optional approval for high-demand free sessions.

## 7. State and payment authority
- Booking: `HELD_FREE`, `HELD_GATEWAY`, `AWAITING_APPROVAL` (paid pay-later), `AWAITING_BANK_REVIEW`, `CONFIRMED`, `EXPIRED`, `CANCELLED`, `COMPLETED`, `NO_SHOW`, `PAYMENT_EXCEPTION`.
- Payment intents: `INITIALIZED`, `PENDING`, `VERIFIED`, `FAILED`, `EXCEPTION`, `REFUNDED`.
- Review: `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `EXPIRED`.
- Notification: `QUEUED`, `SENT`, `DELIVERED`, `FAILED`, `SUPPRESSED`.

A **booking** is a calendar/appointment commitment; a **payment** is financial evidence; a **provider payout** is a separate settlement. Never double count a deposit and remaining balance. Audit corrections, partial payments, refunds, reversals, reschedule costs and status changes.

PostgreSQL partial GiST exclusion constraints must block conflicting active holds and confirmations for the same host (and resource in future). Background expiry jobs change expired hold status; DB constraints cannot include a dynamic `now()` predicate. Lock/expire/recheck/rebook must happen in a transaction, with predictable contention responses. External calendar changes cannot be made atomically with local database transactions; use short cache TTL, sync health and conflict-resolution policy.

## 8. Integrations and onboarding
**Get Started** sequence: identity → service/free price → business availability → choose payment routes → choose calendar → choose messaging channels → publish/verify booking link. Integration catalogue groups:

1. **Payments:** Paystack, Flutterwave, Monnify, merchant bank account, future providers. Merchant-specific credentials never returned by browser API. Prefer authorised OAuth where available; fallback server-side encrypted entry with KMS and credential redaction. Merchant bank accounts require ownership validation where available and an authenticated manual approval workflow.
2. **Calendar:** Google Calendar (OAuth free/busy + event writes, watches/sync), Microsoft Graph (OAuth, getSchedule/delta), Apple Calendar/iCloud through carefully supported CalDAV or read-only ICS subscriptions. Never claim all Apple devices/accounts support direct two-way sync.
3. **Migration:** Calendly and Cal.com CSV/ICS with file preview, mapping, source record ID, deduplication, timezone normalization and confirmation before import; authorised provider APIs only where documented and consented. Historic imported events must NOT become paid/verified.
4. **Messaging:** Email (domain validation, bounced delivery), WhatsApp Business/Cloud API or approved BSP (sender verified, explicit opt-in, template approval), SMS via provider with sender validation, costs and delivery tracking. Allow different channels per merchant and fallback policy. Notification failures do NOT cancel a paid booking.
5. **Octalve:** optional Finance billing handoff, optional EMR appointment handoff. Both require explicit connection, scope consent and independent API. Booking stays functional if either is offline.

## 9. Screen inventory and release priority
**P0 interaction design:** owner overview, booking list/details, mobile booking cards, create/edit service, free appointment, intake form editor, weekly availability and off days, payment rules, integration catalogue, Get Started, public booking page, client status and timezone, cancellation/reschedule flows.

**P0 secure backend release:** tenant/user auth, DB, append-only payment event log, conflict-safe hold engine, free booking path, Paystack approved connection and transaction requery, bank review with staff permissions/audit, email confirmation, calendar sync health, durable reminder delivery, privacy policy and retention rules, monitoring/backups.

**Commercial launch gate:** WhatsApp approved sender/templates if promised to the merchant, SMS integration according to selected plan, delivery status and clear fallback; not all businesses need to activate every provider.

**P1:** Flutterwave/Monnify, Microsoft calendar, migration imports, advanced budgets/questions, basic analytics, embeds, improved messaging routing.
**P2:** team round-robin, room/seat capacity, dedicated native apps, custom domains, advanced routing, subscription/marketplace, external API, Apple CalDAV two-way after provider qualification.

## 10. Explicit feature acceptance criteria
1. Creating a service with ₦0 never initialises a gateway payment.
2. A merchant can create a paid service with 50% upfront due (calculated in minor units), clear remaining balance and no revenue double count.
3. Two simultaneous clients trying the same slot cannot both acquire conflicting active holds.
4. Expired holds are not presented as confirmed, and late payment never forces an overlap.
5. Merchant bank claim remains pending until authorised bank evidence review; public status says **not confirmed**.
6. A second staff member cannot approve the same payment twice; every action is audited and owner-scoped.
7. Provider success webhook is authenticated, deduplicated, independently queried and cross-checked against merchant, amount, currency and expected booking.
8. Disconnecting Google calendar raises visible sync-health status; the system never silently serves stale availability.
9. Imported CSV/ICS records are shown with mapping review and not relabelled confirmed/paid without original evidence.
10. Mobile 320px, 390px, 768px, 1440px has no horizontal page/table overflow; keyboard focus and forms usable.
11. WhatsApp notifications require explicit opt-in and approved templates; failed delivery is queued/reconciled without changing booking payment truth.
12. Finance and EMR stay offline/uninstalled, but Booking still builds, launches, and serves connected-merchant customers.

## 11. Non-functional and security gates
OWASP ASVS-aligned authn/authz, MFA for merchant bank confirmations/provider credential rotation, secure sessions, unique idempotency keys, database uniqueness/exclusion, rate limiting, CSRF, stored-XSS sanitisation, secrets manager/KMS, no plaintext keys in logs, tenant scoping/RLS checks, calendar token revocation and webhook replay protection. Privacy compliance assessment under NDPA 2023; retention, lawful basis, consent/notice, data-subject requests, security incident response. Avoid asking for sensitive health/legal data by default. A production release requires load/concurrency tests, working monitoring, backup recovery exercise, refund/late-payment drills, Vercel deployment protection and hardening.

## 12. Proposed delivery milestones
- **Phase A — Requirements and qualification:** lock exact scope, review competitor patterns, data policies, provider sandbox/production eligibility, merchant onboarding method, migration file examples, visual acceptance.
- **Phase B — Standalone visual foundation:** Octalve design tokens, desktop shell, mobile bar/cards, customer booking, service editor, enquiry builder, integrations, responsive regression. Source is assembled in this package; it is NOT a transactional system.
- **Phase C — Identity + persistence:** staff/users/tenancy, encrypted providers, services/forms, availability, calendar sync, audit and safe migrations.
- **Phase D — Authority:** atomic holds, gateway callback/webhook reconciliation, merchant bank review, valid free booking completion, cancellation/late settlement workflow.
- **Phase E — Messaging and migration:** email/WhatsApp/SMS selection with delivery jobs, calendar providers and import mapping.
- **Phase F — Review qualification:** tests and multi-device browser QA, commercial/privacy/security approval, Preview → main → independent Vercel production.

## 13. Decisions still to validate
- Who approves manual transfers (owner only vs authorised staff), default review window, after-expiry funds resolution.
- Which provider accounts can be connected by small unregistered businesses, and what supports merchant OAuth vs secret credentials.
- Whether standalone personal profiles need a different free/paid tier and privacy defaults.
- Which calendar migration exports can be imported reliably and which types of historic meetings should only become read-only events.
- Initial supported WhatsApp sender/phone onboarding provider and per-message economic model.
- Choice of database region/host and out-of-process worker for timeouts/reminders.

**All code in the initial visual foundation is deliberately fail-closed for live booking submission and financial integration. Not a production-ready transactional application.**
