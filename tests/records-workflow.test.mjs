import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),read=p=>readFileSync(new URL(p,root),'utf8');
const js=read('public/booking.js'),css=read('public/booking.css');
test('booking rows and action menus offer workflow controls',()=>{for(const x of ['openMenu','edit-booking:','reschedule:','cancel-booking:','booking:','client:']) assert.ok(js.includes(x),x);assert.match(js,/stopImmediatePropagation/);});
test('dedicated client profile and booking detail routes',()=>{for(const x of ['const clientDetail=','const bookingDetail=','data-ob="client:','Follow-up stage','Enquiry history','Internal notes'])assert.ok(js.includes(x),x);});
test('review edits cannot claim payments or notifications',()=>{assert.match(js,/No customer message, payment event or calendar update occurs/);assert.match(js,/Another appointment in this review already uses/);assert.match(js,/An authorised server must validate the bank credit independently/);});
test('mobile uses bottom sheets and keyboard focus logic',()=>{assert.match(css,/\.ob-action-card,\.ob-modal-card\{width:100%;max-height:88dvh/);assert.match(css,/\.dialog-overlay\{align-items:end!important/);assert.match(js,/e\.key==='Escape'/);assert.match(js,/e\.key!=='Tab'/);});
test('no Finance or EMR dependency',()=>{assert.doesNotMatch(js,/from\s*['"][^'"]*octalve-(?:invoice|finance|emr)/);});
test('Next and static booking CSS have exact parity',()=>assert.equal(read('app/globals.css'),css));