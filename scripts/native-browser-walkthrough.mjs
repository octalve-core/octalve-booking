import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=process.env.BOOKING_BASE_URL??'http://127.0.0.1:3000';
const output='browser-evidence';await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,recordVideo:{dir:output,size:{width:390,height:844}}});
const page=await context.newPage();let actions=0;const errors=[];page.on('pageerror',e=>errors.push(e.message));
async function click(locator){await locator.click({timeout:15000});actions++;await page.waitForTimeout(240)}
async function link(name){await click(page.getByRole('link',{name,exact:true}).first())}
async function top(){await link('Home')}
try{
 await page.goto(`${root}/?preview=1`,{waitUntil:'networkidle'});actions++;
 await link('Bookings');
 await click(page.getByRole('button',{name:'BK-00084 options'}));
 await click(page.getByRole('link',{name:/Edit booking/}));
 await page.getByRole('textbox',{name:'Reason / internal note'}).fill('Reviewing a proposed scope with the client.');actions++;
 await click(page.getByRole('button',{name:/Save to this review session/}));
 await click(page.getByRole('link',{name:'Back to bookings'}));
 await link('More');await link('Clients');
 await click(page.getByRole('link',{name:'Amara Okafor'}).first());
 await click(page.getByRole('link',{name:/Edit record/}));
 await page.getByRole('textbox',{name:'Internal notes'}).fill('Discuss implementation milestones at next appointment.');actions++;
 await click(page.getByRole('button',{name:/Save example changes/}));
 await click(page.getByRole('link',{name:'Back to clients'}));
 await link('More');await link('Enquiries');
 await click(page.getByRole('link',{name:'Growth strategy advisory'}).first());
 await click(page.getByRole('link',{name:/Update notes and review stage/}));
 await page.getByRole('textbox',{name:'Internal notes'}).fill('Clarify business priorities and timing.');actions++;
 await click(page.getByRole('button',{name:/Save example enquiry/}));
 await link('Services');
 await click(page.getByRole('link',{name:/New service/}));
 await page.getByRole('textbox',{name:'Service title'}).fill('Free introductory call');actions++;
 await page.getByRole('spinbutton',{name:'Price (₦)'}).fill('0');actions++;
 await click(page.getByRole('button',{name:/Save example service/}));
 await link('More');await link('Calendar');
 await page.getByRole('checkbox',{name:'Available Monday'}).check();actions++;
 await click(page.getByRole('button',{name:/Save example hours/}));
 await link('More');await link('Integrations');
 await click(page.getByRole('link',{name:/Connection requirements/}).first());
 await click(page.getByRole('link',{name:'Back to integrations'}));
 await link('More');await link('Payments');
 await link('More');await link('Reports');
 await link('More');await link('Settings');
 await link('Account');
 await top();
 await click(page.getByRole('link',{name:/Booking page/}).first());
 const days=page.locator('button[aria-pressed][aria-label*="2026"]:not(:disabled)');
 if(await days.count())await click(days.first());
 else {const d=page.locator('button[aria-pressed]:not(:disabled)');await click(d.first())}
 await click(page.getByRole('button',{name:'10:00'}));
 await click(page.getByRole('button',{name:/Continue/}));
 await page.getByRole('textbox',{name:'Your name'}).fill('Example Person');actions++;
 await page.getByRole('textbox',{name:'Email address'}).fill('example@example.invalid');actions++;
 await page.getByRole('textbox',{name:'What would you like to discuss?'}).fill('Testing the booking journey without submitting any request.');actions++;
 if(errors.length)throw new Error(`Browser exceptions: ${errors.join('; ')}`);
 await page.screenshot({path:path.join(output,'final-screen.png')});
 await fs.writeFile(path.join(output,'walkthrough-summary.json'),JSON.stringify({actions,errors,lastUrl:page.url(),success:true},null,2));
 console.log(`Passed continuous browser-only walkthrough: ${actions} interactions`);
}catch(error){
 await page.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});
 await fs.writeFile(path.join(output,'walkthrough-summary.json'),JSON.stringify({actions,errors,success:false,message:String(error),lastUrl:page.url()},null,2));
 console.error(error);process.exitCode=1;
}finally{await context.close();await browser.close()}
