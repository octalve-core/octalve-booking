import {chromium} from 'playwright';
import fs from 'node:fs/promises';

// ONE browser tab, ONE start URL, ONE visible click-driven journey.
// No API clients, no database interaction, no browser video/screen recording.
// Every later route is reached by a visible in-app link or action.
const root=process.env.BOOKING_BASE_URL??'http://127.0.0.1:3000';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1});
const page=await context.newPage();
const visited=[],errors=[];let interactions=0,checks=0;
page.on('pageerror',error=>errors.push(String(error)));
await fs.mkdir('browser-evidence',{recursive:true});
async function click(locator){await locator.click({timeout:15000});interactions++}
async function fill(locator,value){await locator.fill(value);interactions++}
async function choose(locator,value){await locator.selectOption(value);interactions++}
async function expectText(text){await page.getByText(text,{exact:true}).first().waitFor({timeout:15000});checks++}
async function expectCount(value){await expectText(String(value)+' results')}
async function assert(condition,message){if(!condition)throw new Error(message);checks++}
async function remember(label){visited.push({label,path:new URL(page.url()).pathname})}
async function mobile(name){await click(page.getByRole('navigation',{name:'Mobile primary navigation'}).getByRole('link',{name,exact:true}))}
async function section(name){if(['Home','Bookings','Services','More','Account'].includes(name)){await mobile(name)}else{await mobile('More');await click(page.getByRole('link',{name,exact:true}).first())}await remember(name)}
async function resetSearch(input){await fill(page.getByRole('textbox',{name:input}), '')}
async function assertNoErrors(){await assert(errors.length===0,'Page error: '+errors.join('; '))}
try{
 await page.goto(root+'/?preview=1',{waitUntil:'networkidle'});interactions++;await remember('Overview');
 await page.getByRole('heading',{name:'Make every appointment count.'}).waitFor();checks++;
 // Real global search, including its zero-result and navigable states.
 await click(page.getByRole('button',{name:'Search workspace'}));
 await fill(page.getByRole('textbox',{name:'Search appointments, clients, services and enquiries'}),'___no_such_record___');
 await page.getByText('No matching destinations.').waitFor();checks++;
 await fill(page.getByRole('textbox',{name:'Search appointments, clients, services and enquiries'}),'Amara');
 await click(page.getByRole('dialog',{name:'Workspace search'}).getByRole('link',{name:/^Amara Okafor Client/}));
 await page.getByRole('heading',{name:'Amara Okafor'}).waitFor();await remember('Global search to client');
 await click(page.getByRole('link',{name:'Back to clients'}));
 await section('Bookings');
 await expectCount(4);
 await click(page.getByRole('button',{name:'Confirmed',exact:true}));
 await expectCount(2);
 await click(page.getByRole('button',{name:'Awaiting bank review',exact:true}));
 await expectCount(1);
 await fill(page.getByRole('textbox',{name:'Search records'}),'does-not-exist');
 await expectCount(0);
 await resetSearch('Search records');
 await click(page.getByRole('button',{name:'All',exact:true}));
 await fill(page.getByRole('textbox',{name:'Search records'}),'BK-00084');
 await expectCount(1);
 await resetSearch('Search records');
 // Example booking: view, edit, reschedule and cancellation review; no actual cancellation.
 await click(page.getByRole('button',{name:'BK-00084 options'}));
 await click(page.getByRole('dialog',{name:'BK-00084 options'}).getByRole('link',{name:/Edit booking/}));
 await remember('Booking edit');
 await fill(page.getByRole('textbox',{name:'Reason / internal note'}),'Browser-only review note; not sent to a customer.');
 await click(page.getByRole('button',{name:/Save to this review session/}));
 await remember('Booking detail');
 await click(page.getByRole('link',{name:'Reschedule',exact:true}));
 await remember('Booking reschedule');
 await click(page.getByRole('link',{name:'Cancel',exact:true}));
 await click(page.getByRole('button',{name:'Booking actions'}));
 await click(page.getByRole('dialog',{name:'Booking actions'}).getByRole('link',{name:/Cancel \/ decline/}));
 await remember('Booking cancellation preview');
 await click(page.getByRole('link',{name:'Back to bookings'}));
 await click(page.getByRole('link',{name:'New booking'}));
 await remember('New example booking');
 await click(page.getByRole('link',{name:'Cancel',exact:true}));
 // Client search + edit.
 await section('Clients');
 await fill(page.getByRole('textbox',{name:'Search clients'}),'CL-0001');await page.getByRole('link',{name:'Amara Okafor'}).waitFor();checks++;
 await resetSearch('Search clients');
 await fill(page.getByRole('textbox',{name:'Search clients'}),'___none___');
 await page.getByText('No matching clients').waitFor();checks++;
 await resetSearch('Search clients');
 await click(page.getByRole('link',{name:'Amara Okafor'}).first());
 await remember('Client details');
 await click(page.getByRole('link',{name:/Edit record/}));
 await remember('Client edit');
 await fill(page.getByRole('textbox',{name:'Internal notes'}),'Example browser journey follow-up.');
 await click(page.getByRole('button',{name:/Save example changes/}));
 await click(page.getByRole('link',{name:'Back to clients'}));
 // Enquiries search, tabs and editable stage.
 await section('Enquiries');
 await expectCount(3);
 await click(page.getByRole('button',{name:'Reviewing',exact:true}));await expectCount(1);
 await click(page.getByRole('button',{name:'Declined',exact:true}));await expectCount(0);
 await click(page.getByRole('button',{name:'All',exact:true}));
 await fill(page.getByRole('textbox',{name:'Search records'}),'Growth strategy');await expectCount(1);
 await resetSearch('Search records');
 await click(page.getByRole('link',{name:'Growth strategy advisory'}).first());await remember('Enquiry detail');
 await click(page.getByRole('link',{name:/Update notes and review stage/}));await remember('Enquiry edit');
 await choose(page.getByRole('combobox',{name:'Review stage'}),'Qualified');
 await fill(page.getByRole('textbox',{name:'Internal notes'}),'Reviewed through UI controls.');
 await click(page.getByRole('button',{name:/Save example enquiry/}));
 await click(page.getByRole('link',{name:'Back to enquiries'}));
 await click(page.getByRole('link',{name:'New enquiry'}));await remember('New enquiry');
 await click(page.getByRole('link',{name:'Back to enquiries'}));
 // Services list search/filter + new service + intake + catalogue state.
 await section('Services');
 await expectCount(3);
 await click(page.getByRole('button',{name:'In catalogue',exact:true}));await expectCount(3);
 await click(page.getByRole('button',{name:'Not in catalogue',exact:true}));await expectCount(0);
 await click(page.getByRole('button',{name:'All',exact:true}));
 await fill(page.getByRole('textbox',{name:'Search records'}),'discovery');await expectCount(1);
 await resetSearch('Search records');
 await click(page.getByRole('link',{name:'New service'}));await remember('New service');
 await fill(page.getByRole('textbox',{name:'Service title'}),'Browser only intro session');
 await choose(page.getByRole('combobox',{name:'Payment policy'}),'Free');
 await click(page.getByRole('button',{name:'Add intake question'}));
 await fill(page.getByRole('textbox',{name:'Question 1 label'}),'What would be useful?');
 await click(page.getByRole('button',{name:/Save example service/}));
 await remember('Service catalogue');
 await expectCount(4);
 await click(page.getByRole('button',{name:'Not in catalogue',exact:true}));await expectCount(1);
 await click(page.getByRole('link',{name:'Browser only intro session'}));await remember('Service edit');
 await page.getByRole('checkbox',{name:'Show in example service catalogue'}).check();interactions++;
 await click(page.getByRole('button',{name:/Save example service/}));
 await click(page.getByRole('button',{name:'Not in catalogue',exact:true}));await expectCount(0);
 await click(page.getByRole('button',{name:'All',exact:true}));await expectCount(4);
 await section('Calendar');await remember('Availability rules');
 await page.getByLabel('Exception date').fill('2026-12-25');interactions++;
 await click(page.getByRole('button',{name:'Add exception'}));
 await fill(page.getByRole('textbox',{name:'Exception reason 2026-12-25'}),'Example holiday');
 await click(page.getByRole('button',{name:/Save example availability/}));
 // Provider categories; every provider detail via in-app links.
 await section('Integrations');
 await page.getByRole('button',{name:'Payments',exact:true}).click();interactions++;
 await page.getByText('4 providers').waitFor();checks++;
 await click(page.getByRole('button',{name:'All',exact:true}));
 await fill(page.getByRole('textbox',{name:'Search integrations'}),'Paystack');
 await page.getByText('1 providers').waitFor();checks++;
 await resetSearch('Search integrations');
 await fill(page.getByRole('textbox',{name:'Search integrations'}),'no-such-provider');
 await page.getByText('No matching providers').waitFor();checks++;
 await resetSearch('Search integrations');
 const providerLinks=page.getByRole('link',{name:/Connection requirements/});
 const providerCount=await providerLinks.count();await assert(providerCount===15,'Expected all fifteen provider cards');
 for(let i=0;i<providerCount;i++){
  await click(page.getByRole('link',{name:/Connection requirements/}).nth(i));
  await remember('Integration '+(i+1));
  await page.getByRole('heading',{name:'Connection preparation'}).waitFor();checks++;
  if(await page.getByRole('heading',{name:'Local file-selection preview'}).count()){
   const chooserPromise=page.waitForEvent('filechooser');
   await click(page.getByLabel('Example migration file'));
   const chooser=await chooserPromise;
   await chooser.setFiles({name:'sample-review.csv',mimeType:'text/csv',buffer:Buffer.from('name,start\\nExample,2026-12-01\\n')});interactions++;
   await page.getByText('Selected locally: sample-review.csv.',{exact:false}).waitFor();checks++;
  }
  await click(page.getByRole('link',{name:'Back to integrations'}));
 }
 // Payment status filtering and detail navigation.
 await section('Payments');
 await expectCount(4);
 await click(page.getByRole('button',{name:'Awaiting payment',exact:true}));await expectCount(1);
 await fill(page.getByRole('textbox',{name:'Search records'}),'Zainab');await expectCount(1);
 await resetSearch('Search records');
 await click(page.getByRole('button',{name:'All',exact:true}));
 await click(page.getByRole('link',{name:/BK-00085/}));await remember('Payment to booking');
 await click(page.getByRole('link',{name:'Back to bookings'}));
 await section('Reports');await page.getByRole('heading',{name:'Reports'}).waitFor();checks++;
 await section('Settings');await page.getByRole('heading',{name:'Settings'}).waitFor();checks++;
 await click(page.getByRole('link',{name:/Account & security/}));await remember('Security profile');
 await click(page.getByRole('link',{name:'Sign in'}));await remember('Sign-in via Account');
 await page.getByRole('heading',{name:'Welcome back!'}).waitFor();checks++;
 await click(page.getByRole('link',{name:'Create an account'}));await remember('Sign-up');
 await page.getByRole('heading',{name:'Create your booking workspace'}).waitFor();checks++;
 await click(page.getByRole('link',{name:'Sign in',exact:true}));await remember('Sign-in return');
 await click(page.getByRole('link',{name:'Forgot password?'}));await remember('Password recovery');
 await click(page.getByRole('link',{name:'Back to sign in'}));
 await click(page.getByRole('link',{name:'Back to workspace'}));
 await section('Get started');await page.getByText('Live booking readiness:',{exact:false}).waitFor();checks++;
 await click(page.getByRole('link',{name:/7\. Review the public booking journey/}));await remember('Public booking journey');
 // The public page is the last stop: choose a date/time, fill fields; never submit.
 const dateButton=page.locator('button[aria-pressed][aria-label]:not(:disabled)').first();
 await click(dateButton);
 await click(page.getByRole('button',{name:'10:00',exact:true}));
 await click(page.getByRole('button',{name:/Continue/}));
 await fill(page.getByRole('textbox',{name:'Your name'}),'Example Person');
 await fill(page.getByRole('textbox',{name:'Email address'}),'example@example.invalid');
 await fill(page.getByRole('textbox',{name:'What would you like to discuss?'}),'Reviewing a non-live workflow, no submission.');
 await assertNoErrors();
 const summary={success:true,interactions,checks,visited,errors,lastUrl:page.url(),mode:'one continuous browser-only walkthrough, no recording'};
 await fs.writeFile('browser-evidence/walkthrough-summary.json',JSON.stringify(summary,null,2));
 console.log('PASS: '+interactions+' browser interactions, '+checks+' checks, '+visited.length+' visits, 15 providers; no API calls or deep URL jumps');
}catch(error){
 const summary={success:false,interactions,checks,visited,errors,lastUrl:page.url(),error:String(error)};
 await fs.writeFile('browser-evidence/walkthrough-summary.json',JSON.stringify(summary,null,2));
 console.error(JSON.stringify(summary,null,2));process.exitCode=1;
}finally{await context.close();await browser.close()}
