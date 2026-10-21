-- B3: tenant-scoped booking engine schema. This migration creates tables, not live booking operations.
-- Every mutation must be made by a trusted backend with verified membership and slot authority.
BEGIN;
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE SCHEMA IF NOT EXISTS booking_core;
CREATE TABLE booking_core.services (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 workspace_id uuid NOT NULL REFERENCES booking_auth.workspaces(id) ON DELETE RESTRICT,
 name text NOT NULL CHECK(length(btrim(name)) BETWEEN 2 AND 120),
 description text NOT NULL DEFAULT '',
 duration_minutes integer NOT NULL CHECK(duration_minutes BETWEEN 5 AND 720),
 buffer_before_minutes integer NOT NULL DEFAULT 0 CHECK(buffer_before_minutes BETWEEN 0 AND 240),
 buffer_after_minutes integer NOT NULL DEFAULT 0 CHECK(buffer_after_minutes BETWEEN 0 AND 240),
 price_minor bigint NOT NULL DEFAULT 0 CHECK(price_minor>=0),
 deposit_minor bigint NOT NULL DEFAULT 0 CHECK(deposit_minor>=0),
 currency char(3) NOT NULL DEFAULT 'NGN' CHECK(currency ~ '^[A-Z]{3}$'),
 payment_policy text NOT NULL DEFAULT 'free' CHECK(payment_policy IN ('free','deposit','full','pay_later')),
 is_published boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(id,workspace_id), CHECK(deposit_minor<=price_minor)
);
CREATE INDEX booking_services_workspace_idx ON booking_core.services(workspace_id,is_published);
CREATE TABLE booking_core.staff (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 workspace_id uuid NOT NULL REFERENCES booking_auth.workspaces(id) ON DELETE RESTRICT,
 user_id uuid REFERENCES booking_auth.users(id) ON DELETE RESTRICT,
 display_name text NOT NULL CHECK(length(btrim(display_name)) BETWEEN 2 AND 120),
 is_active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(id,workspace_id),UNIQUE(workspace_id,user_id)
);
CREATE TABLE booking_core.service_staff (
 workspace_id uuid NOT NULL REFERENCES booking_auth.workspaces(id),
 service_id uuid NOT NULL,
 staff_id uuid NOT NULL,
 PRIMARY KEY(service_id,staff_id),
 FOREIGN KEY(service_id,workspace_id) REFERENCES booking_core.services(id,workspace_id),
 FOREIGN KEY(staff_id,workspace_id) REFERENCES booking_core.staff(id,workspace_id)
);
CREATE TABLE booking_core.weekly_hours (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 workspace_id uuid NOT NULL REFERENCES booking_auth.workspaces(id),
 staff_id uuid NOT NULL,
 weekday smallint NOT NULL CHECK(weekday BETWEEN 0 AND 6),
 start_local time NOT NULL,
 end_local time NOT NULL,
 CHECK(start_local<end_local),
 FOREIGN KEY(staff_id,workspace_id) REFERENCES booking_core.staff(id,workspace_id)
);
CREATE INDEX booking_hours_staff_day_idx ON booking_core.weekly_hours(staff_id,weekday);
CREATE TABLE booking_core.date_overrides (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 workspace_id uuid NOT NULL REFERENCES booking_auth.workspaces(id),
 staff_id uuid NOT NULL,
 date_local date NOT NULL,
 is_closed boolean NOT NULL DEFAULT false,
 start_local time,
 end_local time,
 CHECK((is_closed AND start_local IS NULL AND end_local IS NULL) OR
   (NOT is_closed AND start_local IS NOT NULL AND end_local IS NOT NULL AND start_local<end_local)),
 FOREIGN KEY(staff_id,workspace_id) REFERENCES booking_core.staff(id,workspace_id)
);
CREATE INDEX booking_overrides_staff_date_idx ON booking_core.date_overrides(staff_id,date_local);
CREATE TABLE booking_core.clients (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 workspace_id uuid NOT NULL REFERENCES booking_auth.workspaces(id),
 full_name text NOT NULL CHECK(length(btrim(full_name)) BETWEEN 2 AND 120),
 email citext NOT NULL,
 phone_e164 text CHECK(phone_e164 ~ '^\+[1-9][0-9]{6,14}$'),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(id,workspace_id)
);
CREATE INDEX booking_clients_workspace_email_idx ON booking_core.clients(workspace_id,email);
-- A slot claim's occupied range includes service buffers. Holds are database-controlled,
-- not merely calculated by a frontend calendar.
CREATE TABLE booking_core.slot_claims (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 workspace_id uuid NOT NULL REFERENCES booking_auth.workspaces(id),
 service_id uuid NOT NULL,
 staff_id uuid NOT NULL,
 client_id uuid NOT NULL,
 starts_at timestamptz NOT NULL,
 ends_at timestamptz NOT NULL,
 occupied_range tstzrange NOT NULL,
 state text NOT NULL DEFAULT 'held' CHECK(state IN ('held','confirmed','released')),
 hold_expires_at timestamptz,
 idempotency_digest char(64) NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(ends_at>starts_at),
 CHECK(lower(occupied_range)<=starts_at AND upper(occupied_range)>=ends_at),
 CHECK(NOT isempty(occupied_range)),
 CHECK((state='held' AND hold_expires_at IS NOT NULL) OR state<>'held'),
 UNIQUE(workspace_id,idempotency_digest),
 UNIQUE(id,workspace_id),
 FOREIGN KEY(service_id,workspace_id) REFERENCES booking_core.services(id,workspace_id),
 FOREIGN KEY(staff_id,workspace_id) REFERENCES booking_core.staff(id,workspace_id),
 FOREIGN KEY(client_id,workspace_id) REFERENCES booking_core.clients(id,workspace_id),
 EXCLUDE USING gist (staff_id WITH =, occupied_range WITH &&)
 WHERE (state IN ('held','confirmed'))
);
CREATE INDEX booking_claim_expiry_idx ON booking_core.slot_claims(hold_expires_at) WHERE state='held';
CREATE INDEX booking_claim_workspace_start_idx ON booking_core.slot_claims(workspace_id,starts_at DESC);
CREATE TABLE booking_core.bookings (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 workspace_id uuid NOT NULL REFERENCES booking_auth.workspaces(id),
 claim_id uuid NOT NULL UNIQUE,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','cancelled','completed','declined')),
 note text NOT NULL DEFAULT '',
 confirmed_at timestamptz,
 cancelled_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(id,workspace_id),
 FOREIGN KEY(claim_id,workspace_id) REFERENCES booking_core.slot_claims(id,workspace_id)
);
CREATE INDEX booking_records_workspace_idx ON booking_core.bookings(workspace_id,created_at DESC);
CREATE TABLE booking_core.audit_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 workspace_id uuid NOT NULL REFERENCES booking_auth.workspaces(id),
 booking_id uuid,
 actor_user_id uuid REFERENCES booking_auth.users(id),
 action text NOT NULL,
 occurred_at timestamptz NOT NULL DEFAULT now(),
 correlation_id text,
 FOREIGN KEY(booking_id,workspace_id) REFERENCES booking_core.bookings(id,workspace_id)
);
REVOKE ALL ON SCHEMA booking_core FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA booking_core FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA booking_core FROM PUBLIC;
ALTER TABLE booking_core.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_core.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_core.service_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_core.weekly_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_core.date_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_core.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_core.slot_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_core.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_core.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_core.services FORCE ROW LEVEL SECURITY;
ALTER TABLE booking_core.staff FORCE ROW LEVEL SECURITY;
ALTER TABLE booking_core.service_staff FORCE ROW LEVEL SECURITY;
ALTER TABLE booking_core.weekly_hours FORCE ROW LEVEL SECURITY;
ALTER TABLE booking_core.date_overrides FORCE ROW LEVEL SECURITY;
ALTER TABLE booking_core.clients FORCE ROW LEVEL SECURITY;
ALTER TABLE booking_core.slot_claims FORCE ROW LEVEL SECURITY;
ALTER TABLE booking_core.bookings FORCE ROW LEVEL SECURITY;
ALTER TABLE booking_core.audit_events FORCE ROW LEVEL SECURITY;
COMMIT;
