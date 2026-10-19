import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
const base=path.resolve(import.meta.dirname,'..');
const js=fs.readFileSync(path.join(base,'public/booking.js'),'utf8');const css=fs.readFileSync(path.join(base,'public/booking.css'),'utf8');
test('booking app is independent of Finance and EMR at runtime',()=>{assert.doesNotMatch(js,/from\s+['"][^'"]*octalve-(?:finance|invoice|emr)/);assert.doesNotMatch(css,/url\(.*octalve-(?:finance|invoice|emr)/)});
test('public workflow exposes separate free, gateway and bank methods',()=>{assert.match(js,/Free consultation/);assert.match(js,/Awaiting bank review/);assert.match(js,/Gateway payment/);assert.match(js,/Free appointment/)});
test('integration catalogue includes WhatsApp SMS Google Microsoft Apple Calendly Cal.com',()=>{for(const s of ['WhatsApp Business','SMS delivery','Google Calendar','Microsoft Outlook','Apple Calendar','Calendly migration','Cal.com migration'])assert.ok(js.includes(s),s)});
test('mobile records do not rely on scrolling desktop tables',()=>{assert.match(js,/mobile-cards/);assert.match(css,/@media\(max-width:760px\)/);assert.match(css,/\.table-wrap\{display:none\}/)});
test('secret inputs do not appear in client interface',()=>{assert.doesNotMatch(js,/<input[^>]*(?:api[_ -]?key|secret|token)/i)});

test('the booking and database hold states agree',()=>{const sql=fs.readFileSync(path.join(base,'prisma/authority_schema.sql'),'utf8');assert.match(sql,/'HELD_FREE'/);assert.match(sql,/'HELD_GATEWAY'/);assert.match(sql,/status IN \('HELD_FREE','HELD_GATEWAY'/)});
test('the public app cannot display seeded confirmations unless explicitly locally reviewed',()=>{assert.match(js,/const localReview=\(/);assert.match(js,/services:localReview\?seedServices/);assert.match(js,/bookings:localReview\?seedBookings/);assert.match(js,/Booking is not yet available/);assert.doesNotMatch(js,/https:\/\/booking\.octalve\.com\/b\/octalve-studio/)});

test('Next shell and standalone public UI share identical booking styles',()=>{const appCss=fs.readFileSync(path.join(base,'app/globals.css'),'utf8');assert.equal(appCss,css)});
