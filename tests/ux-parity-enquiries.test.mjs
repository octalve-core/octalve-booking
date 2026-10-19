import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const js=read('public/booking.js'),css=read('public/booking.css');
test('enquiries include editable records, internal notes, review status, decline and creation',()=>{for(const x of ['enqPage','enqDetail','enquiry-edit:','enquiry-note:','enquiry-status:','enquiry-decline:','new-enquiry'])assert.ok(js.includes(x),x)});
test('workspace profile and dashboard quick create are purposeful',()=>{for(const x of ['Account & profile','Quick Create','New enquiry','Set<br>availability','bx-account-hero'])assert.ok((js+css).includes(x),x)});
test('Finance-aligned actions and white surfaces support mobile',()=>{assert.match(css,/--surface:#fff/);assert.match(css,/\.mobile-menu-btn\{display:none!important/);assert.match(css,/\.bx-action-icon/);assert.match(css,/\.bx-quick-grid/);assert.match(js,/enqMenu/);assert.match(js,/closeDialog/);});
test('enquiry UI cannot claim server writes, payment or message delivery',()=>{assert.match(js,/current browser session/);assert.match(js,/They do not send messages, publish data or alter payments/);assert.doesNotMatch(js,/fetch\(['"]\/api\/v1\/bookings\/save/);});
test('Next and public CSS stay in sync and Booking remains independent',()=>{assert.equal(css,read('app/globals.css'));assert.doesNotMatch(js,/from\s*['"][^'"]*octalve-(?:finance|invoice|emr)/)});
