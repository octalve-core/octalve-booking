-- Octalve Booking domain model: REVIEW ONLY. DO NOT APPLY AS-IS TO PRODUCTION.
-- Enforce uniqueness within organisations, tenant-safe access policies, transaction locks,
-- secure backend sessions, full migration tests and conflict-safe revalidation first.
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TYPE booking_status AS ENUM (
 'HELD_FREE','HELD_GATEWAY','AWAITING_APPROVAL','AWAITING_BANK_REVIEW','CONFIRMED','EXPIRED',
 'CANCELLED','COMPLETED','NO_SHOW','PAYMENT_EXCEPTION'
);
CREATE TABLE booking_organisation (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text UNIQUE NOT NULL,
 name text NOT NULL, timezone text NOT NULL DEFAULT 'Africa/Lagos',
 currency char(3) NOT NULL DEFAULT 'NGN', profile_type text NOT NULL
 CHECK (profile_type IN ('business','individual')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE booking_user (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL UNIQUE,
 email_verified_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE booking_membership (
 organisation_id uuid NOT NULL REFERENCES booking_organisation(id),
 user_id uuid NOT NULL REFERENCES booking_user(id), role text NOT NULL
 CHECK (role IN ('owner','admin','staff','viewer')),
 PRIMARY KEY(organisation_id,user_id)
);
CREATE TABLE booking_service (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organisation_id uuid NOT NULL REFERENCES booking_organisation(id),
 title text NOT NULL, slug text NOT NULL, duration_minutes int NOT NULL CHECK(duration_minutes BETWEEN 5 AND 480),
 buffer_before_minutes int NOT NULL DEFAULT 0 CHECK(buffer_before_minutes BETWEEN 0 AND 240),
 buffer_after_minutes int NOT NULL DEFAULT 0 CHECK(buffer_after_minutes BETWEEN 0 AND 240),
 price_minor bigint NOT NULL DEFAULT 0 CHECK(price_minor>=0),
 currency char(3) NOT NULL DEFAULT 'NGN',
 deposit_percent int NOT NULL DEFAULT 100 CHECK(deposit_percent BETWEEN 0 AND 100),
 min_notice_minutes int NOT NULL DEFAULT 120 CHECK(min_notice_minutes>=0),
 is_active boolean NOT NULL DEFAULT false, description text NOT NULL DEFAULT '',
 UNIQUE(organisation_id,slug), UNIQUE(organisation_id,id)
);
CREATE TABLE booking_availability_rule (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organisation_id uuid NOT NULL REFERENCES booking_organisation(id),
 host_user_id uuid NOT NULL REFERENCES booking_user(id),
 weekday int NOT NULL CHECK(weekday BETWEEN 0 AND 6),
 start_local time NOT NULL, end_local time NOT NULL CHECK(end_local>start_local),
 timezone text NOT NULL DEFAULT 'Africa/Lagos'
);
CREATE TABLE booking_appointment (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organisation_id uuid NOT NULL REFERENCES booking_organisation(id),
 host_user_id uuid NOT NULL REFERENCES booking_user(id),
 service_id uuid NOT NULL,
 public_reference text NOT NULL,
 client_email text NOT NULL, client_name text NOT NULL, client_phone text,
 starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL,
 before_minutes int NOT NULL DEFAULT 0, after_minutes int NOT NULL DEFAULT 0,
 conflict_range tstzrange GENERATED ALWAYS AS (
 tstzrange(starts_at-(before_minutes*interval '1 minute'),ends_at+(after_minutes*interval '1 minute'),'[)')
 ) STORED,
 status booking_status NOT NULL,
 hold_expires_at timestamptz,
 price_minor bigint NOT NULL CHECK(price_minor>=0),
 due_minor bigint NOT NULL CHECK(due_minor>=0),
 payment_method text NOT NULL CHECK(payment_method IN ('free','gateway','merchant_bank','pay_later')),
 confirmed_payment_id uuid, confirmed_by uuid, confirmed_at timestamptz,
 payment_review_note text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(ends_at>starts_at),
 CHECK(status NOT IN ('HELD_FREE','HELD_GATEWAY','AWAITING_APPROVAL','AWAITING_BANK_REVIEW') OR hold_expires_at IS NOT NULL),
 CHECK(status!='CONFIRMED' OR (due_minor=0 OR confirmed_payment_id IS NOT NULL)),
 UNIQUE(organisation_id,public_reference), UNIQUE(organisation_id,id),
 FOREIGN KEY(organisation_id,service_id) REFERENCES booking_service(organisation_id,id)
);
-- Must atomically expire stale rows before inserting a new hold; WHERE cannot use now().
ALTER TABLE booking_appointment ADD CONSTRAINT no_overlapping_held_or_confirmed_bookings
 EXCLUDE USING gist (organisation_id WITH =,host_user_id WITH =,conflict_range WITH &&)
 WHERE (status IN ('HELD_FREE','HELD_GATEWAY','AWAITING_APPROVAL','AWAITING_BANK_REVIEW','CONFIRMED','COMPLETED'));
CREATE TABLE booking_payment_connection (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organisation_id uuid NOT NULL REFERENCES booking_organisation(id),
 provider text NOT NULL CHECK(provider IN ('paystack','flutterwave','monnify','merchant_bank')),
 external_merchant_reference text, encrypted_secret_reference text,
 status text NOT NULL CHECK(status IN ('disconnected','pending_validation','connected','error','revoked')),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(organisation_id,id)
);
CREATE TABLE booking_payment_intent (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organisation_id uuid NOT NULL,
 appointment_id uuid NOT NULL, connection_id uuid NOT NULL,
 provider_reference text NOT NULL, amount_minor bigint NOT NULL CHECK(amount_minor>=0),
 currency char(3) NOT NULL, status text NOT NULL,
 verified_at timestamptz, provider_transaction_id text,
 UNIQUE(connection_id,provider_reference), UNIQUE(organisation_id,id),
 FOREIGN KEY(organisation_id,appointment_id) REFERENCES booking_appointment(organisation_id,id),
 FOREIGN KEY(organisation_id,connection_id) REFERENCES booking_payment_connection(organisation_id,id)
);
CREATE TABLE booking_bank_review (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organisation_id uuid NOT NULL,
 appointment_id uuid NOT NULL, status text NOT NULL CHECK(status IN ('submitted','under_review','approved','rejected','expired')),
 claimed_at timestamptz, evidence_object_key text,
 approved_by uuid, approved_at timestamptz, review_note text,
 FOREIGN KEY(organisation_id,appointment_id) REFERENCES booking_appointment(organisation_id,id)
);
CREATE TABLE booking_provider_event (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),connection_id uuid NOT NULL REFERENCES booking_payment_connection(id),
 provider_event_id text NOT NULL, signature_verified boolean NOT NULL DEFAULT false,
 payload_ref text, received_at timestamptz NOT NULL DEFAULT now(),processed_at timestamptz,
 UNIQUE(connection_id,provider_event_id)
);
CREATE TABLE booking_calendar_connection (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),organisation_id uuid NOT NULL REFERENCES booking_organisation(id),
 user_id uuid NOT NULL REFERENCES booking_user(id),provider text NOT NULL,
 encrypted_token_ref text,health text NOT NULL DEFAULT 'disconnected',
 last_sync_at timestamptz, token_expires_at timestamptz
);
CREATE TABLE booking_intake_response (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),organisation_id uuid NOT NULL,
 appointment_id uuid NOT NULL, schema_version integer NOT NULL,
 answers jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(organisation_id,appointment_id) REFERENCES booking_appointment(organisation_id,id)
);
CREATE TABLE booking_notification_job (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),organisation_id uuid NOT NULL,
 appointment_id uuid NOT NULL, channel text NOT NULL,
 template_id text NOT NULL,deliver_after timestamptz NOT NULL,
 status text NOT NULL DEFAULT 'queued',attempts int NOT NULL DEFAULT 0,
 FOREIGN KEY(organisation_id,appointment_id) REFERENCES booking_appointment(organisation_id,id)
);
CREATE TABLE booking_audit_event (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),organisation_id uuid NOT NULL REFERENCES booking_organisation(id),
 actor_user_id uuid,event_type text NOT NULL,entity_id uuid NOT NULL,
 event_at timestamptz NOT NULL DEFAULT now(),details jsonb NOT NULL DEFAULT '{}'
);
-- Note: production needs RLS policy design, secure owner-scoped queries, outbox, encryption,
-- transfer evidence file scanning, signed invitation tokens, retries, and full migration dry-run.
