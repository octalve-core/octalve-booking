-- B2 trusted-application database role. MIGRATION OWNER ONLY; never execute from a browser.
-- This non-login role is for a SERVER-ONLY Booking authentication adapter.
-- The separate login from DATABASE_URL must be explicitly granted membership by
-- the database administrator. Do not use a superuser or BYPASSRLS login.
BEGIN;
DO $booking_role$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='booking_identity_service') THEN
  CREATE ROLE booking_identity_service NOLOGIN NOBYPASSRLS;
 END IF;
END $booking_role$;
GRANT USAGE ON SCHEMA booking_auth TO booking_identity_service;
GRANT SELECT,INSERT,UPDATE ON ALL TABLES IN SCHEMA booking_auth TO booking_identity_service;
GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA booking_auth TO booking_identity_service;
-- Auth rows are deliberately server-scoped, not browser-exposed. Backend code
-- must enforce identity, purpose, atomic updates and throttling.
CREATE POLICY booking_auth_server_users ON booking_auth.users
 FOR ALL TO booking_identity_service USING (true) WITH CHECK (true);
CREATE POLICY booking_auth_server_workspaces ON booking_auth.workspaces
 FOR ALL TO booking_identity_service USING (true) WITH CHECK (true);
CREATE POLICY booking_auth_server_memberships ON booking_auth.memberships
 FOR ALL TO booking_identity_service USING (true) WITH CHECK (true);
CREATE POLICY booking_auth_server_sessions ON booking_auth.sessions
 FOR ALL TO booking_identity_service USING (true) WITH CHECK (true);
CREATE POLICY booking_auth_server_one_time_tokens ON booking_auth.one_time_tokens
 FOR ALL TO booking_identity_service USING (true) WITH CHECK (true);
CREATE POLICY booking_auth_server_oauth_identities ON booking_auth.oauth_identities
 FOR ALL TO booking_identity_service USING (true) WITH CHECK (true);
CREATE POLICY booking_auth_server_invitations ON booking_auth.invitations
 FOR ALL TO booking_identity_service USING (true) WITH CHECK (true);
CREATE POLICY booking_auth_server_events ON booking_auth.auth_events
 FOR ALL TO booking_identity_service USING (true) WITH CHECK (true);
CREATE POLICY booking_auth_server_rate_limits ON booking_auth.rate_limits
 FOR ALL TO booking_identity_service USING (true) WITH CHECK (true);
CREATE POLICY booking_auth_server_mail_outbox ON booking_auth.mail_outbox
 FOR ALL TO booking_identity_service USING (true) WITH CHECK (true);
-- Crucial: no policies or privileges are granted on booking_core,
-- booking_payments or booking_integrations in this migration.
COMMIT;
