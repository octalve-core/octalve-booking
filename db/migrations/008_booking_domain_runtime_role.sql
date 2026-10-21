-- Trusted Booking-domain runtime role, explicitly tenant-scoped through SET LOCAL.
-- Only the database administrator may grant this NOLOGIN role to the server's login.
BEGIN;
ALTER TABLE booking_core.services
 ADD COLUMN min_notice_hours integer NOT NULL DEFAULT 1 CHECK(min_notice_hours BETWEEN 0 AND 720),
 ADD COLUMN max_advance_days integer NOT NULL DEFAULT 90 CHECK(max_advance_days BETWEEN 1 AND 365);
DO $booking_domain_role$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='booking_domain_service') THEN
  CREATE ROLE booking_domain_service NOLOGIN NOBYPASSRLS;
 END IF;
END $booking_domain_role$;
GRANT USAGE ON SCHEMA booking_core TO booking_domain_service;
GRANT SELECT,INSERT,UPDATE ON ALL TABLES IN SCHEMA booking_core TO booking_domain_service;
GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA booking_core TO booking_domain_service;
CREATE POLICY booking_domain_services ON booking_core.services FOR ALL TO booking_domain_service
 USING (workspace_id::text=current_setting('booking.workspace_id',true))
 WITH CHECK(workspace_id::text=current_setting('booking.workspace_id',true));
CREATE POLICY booking_domain_staff ON booking_core.staff FOR ALL TO booking_domain_service
 USING (workspace_id::text=current_setting('booking.workspace_id',true))
 WITH CHECK(workspace_id::text=current_setting('booking.workspace_id',true));
CREATE POLICY booking_domain_staff_services ON booking_core.service_staff FOR ALL TO booking_domain_service
 USING (workspace_id::text=current_setting('booking.workspace_id',true))
 WITH CHECK(workspace_id::text=current_setting('booking.workspace_id',true));
CREATE POLICY booking_domain_hours ON booking_core.weekly_hours FOR ALL TO booking_domain_service
 USING (workspace_id::text=current_setting('booking.workspace_id',true))
 WITH CHECK(workspace_id::text=current_setting('booking.workspace_id',true));
CREATE POLICY booking_domain_overrides ON booking_core.date_overrides FOR ALL TO booking_domain_service
 USING (workspace_id::text=current_setting('booking.workspace_id',true))
 WITH CHECK(workspace_id::text=current_setting('booking.workspace_id',true));
CREATE POLICY booking_domain_clients ON booking_core.clients FOR ALL TO booking_domain_service
 USING (workspace_id::text=current_setting('booking.workspace_id',true))
 WITH CHECK(workspace_id::text=current_setting('booking.workspace_id',true));
CREATE POLICY booking_domain_claims ON booking_core.slot_claims FOR ALL TO booking_domain_service
 USING (workspace_id::text=current_setting('booking.workspace_id',true))
 WITH CHECK(workspace_id::text=current_setting('booking.workspace_id',true));
CREATE POLICY booking_domain_bookings ON booking_core.bookings FOR ALL TO booking_domain_service
 USING (workspace_id::text=current_setting('booking.workspace_id',true))
 WITH CHECK(workspace_id::text=current_setting('booking.workspace_id',true));
CREATE POLICY booking_domain_audit ON booking_core.audit_events FOR ALL TO booking_domain_service
 USING (workspace_id::text=current_setting('booking.workspace_id',true))
 WITH CHECK(workspace_id::text=current_setting('booking.workspace_id',true));
-- No Booking-domain role privileges on booking_auth, booking_payments or booking_integrations.
COMMIT;
