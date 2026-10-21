# Booking hold engine (B3)

The server-only reservation transaction uses verified workspace authority, a tenant-local PostgreSQL RLS context, published services, staff assignments, weekly hours or date overrides and real time-zone / DST checks. A GiST exclusion constraint on staff occupied ranges rejects overlapping holds. HMAC idempotency prevents duplicate replay; every held booking begins **pending**, not confirmed.

It does NOT accept a public anonymous browser booking yet. The server must derive `authorized` from the session guard, look up workspace timezone using a trusted account-role query, and call `makeStaffSlotHold` with a separate Booking data-role pool. The database owner must grant `booking_domain_service` to a dedicated server-only login. Do not use the same credential as `booking_identity_service`. No route is enabled without these checks.

Missing before public booking activation: real guest identity/consent, safe invite token, customer create/dedupe, refund/late payment handling, conflict hold timeout reconciliation, rescheduling transaction, appointment reminders and end-to-end provider/merchant verification.
