import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const paths=['001_booking_auth.sql','002_booking_rate_limits.sql','003_booking_mail_outbox.sql','004_booking_engine.sql','005_booking_payments.sql','006_booking_integrations.sql','007_booking_identity_service_role.sql'];
test('every identity migration is a single atomic transaction without trailing statements',()=>{
 for(const p of paths){
  const sql=readFileSync(new URL('../db/migrations/'+p,import.meta.url),'utf8');
  assert.equal((sql.match(/^BEGIN;$/gm)||[]).length,1,p);
  assert.equal((sql.match(/^COMMIT;$/gm)||[]).length,1,p);
  assert.equal(sql.trim().endsWith('COMMIT;'),true,p);
  assert.equal(sql.slice(sql.indexOf('COMMIT;')+7).trim(),'',
    p+' has statements after COMMIT, indicating duplicated or malformed SQL');
  assert.match(sql,/FORCE ROW LEVEL SECURITY/,p);
 }
});
test('booking identity foundation defines eight tables exactly once',()=>{
 const sql=readFileSync(new URL('../db/migrations/001_booking_auth.sql',import.meta.url),'utf8');
 const tables=['users','workspaces','memberships','sessions','one_time_tokens','oauth_identities','invitations','auth_events'];
 for(const table of tables){
  assert.equal(sql.split('CREATE TABLE IF NOT EXISTS booking_auth.'+table+' (').length-1,1,
   'missing or duplicate '+table);
 }
 assert.equal((sql.match(/CREATE TABLE IF NOT EXISTS booking_auth\./g)||[]).length,8);
 assert.ok(sql.includes(String.raw`phone_e164 ~ '^\+[1-9][0-9]{6,14}$'`));
});
