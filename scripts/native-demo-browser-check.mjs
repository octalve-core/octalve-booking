import {chromium} from 'playwright';
import fs from 'node:fs/promises';

// Demo acceptance: one tab, one initial entry point, UI navigation only.
// No browser recording, external APIs, direct deep-page jumps or database changes.
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844}});
const page=await context.newPage();const errors=[];const visited=[];let interactions=0,checks=0;
page.on('pageerror',e=>errors.push(String(e)));
async function click(el){await el.click({timeout:15000});interactions++}
async function fill(el,v){await el.fill(v);interactions++}
async function visit(name){await click(page.getByRole('navigation',{name:'Mobile primary navigation'}).getByRole('link',{name,exact:true}));visited.push({name,path:new URL(page.url()).pathname})}
async function more(name){await visit('More');await click(page.getByRole('link',{name,exact:true}).first());visited.push({name,path:new URL(page.url()).pathname})}
async function matches(n){await page.getByText(n+' results',{exact:true}).waitFor();checks++}
try{
 await page.goto((process.env.BOOKING_BASE_URL??'http://127.0.0.1:3000')+'/',{waitUntil:'networkidle'});interactions++;visited.push({name:'Overview',path:'/'});
 await page.getByText('BOOKING · DEMO').waitFor();checks++;
 await page.getByText('23').first().waitFor();checks++;
 await click(page.getByRole('button',{name:'Search workspace'}));
 await fill(page.getByRole('textbox',{name:'Search appointments, clients, services and enquiries'}),'CL-0012');
 await click(page.getByRole('dialog',{name:'Workspace search'}).getByRole('link',{name:/Kabiru Sani Client/}));
 await page.getByRole('heading',{name:'Kabiru Sani'}).waitFor();checks++;visited.push({name:'Global client search',path:new URL(page.url()).pathname});
 await visit('Bookings');await matches(23);
 await click(page.getByRole('button',{name:'Awaiting bank review',exact:true}));await matches(4);
 await click(page.getByRole('button',{name:'All',exact:true}));
 await fill(page.getByRole('textbox',{name:'Search records'}),'BK-00106');await matches(1);
 await fill(page.getByRole('textbox',{name:'Search records'}),'');await matches(23);
 await click(page.getByRole('button',{name:'BK-00084 options'}));
 await click(page.getByRole('dialog',{name:'BK-00084 options'}).getByRole('link',{name:/Edit booking/}));visited.push({name:'Booking edit',path:new URL(page.url()).pathname});
 await page.getByRole('textbox',{name:'Reason / internal note'}).waitFor();checks++;
 await click(page.getByRole('link',{name:'Back to bookings'}));
 await more('Clients');
 await fill(page.getByRole('textbox',{name:'Search clients'}),'Adaobi');
 await page.getByRole('link',{name:'Adaobi Umeh'}).waitFor();checks++;
 await fill(page.getByRole('textbox',{name:'Search clients'}),'');
 await more('Enquiries');await matches(10);
 await click(page.getByRole('button',{name:'Qualified',exact:true}));await matches(3);
 await more('Services');await matches(8);
 await click(page.getByRole('button',{name:'Not in catalogue',exact:true}));await matches(1);
 await click(page.getByRole('button',{name:'All',exact:true}));await matches(8);
 await click(page.getByRole('link',{name:'New service'}));visited.push({name:'New service',path:new URL(page.url()).pathname});
 await fill(page.getByRole('textbox',{name:'Service title'}),'Demo exploration service');
 await click(page.getByRole('button',{name:'Save service'}));
 await page.getByText('9 results',{exact:true}).waitFor();checks++;
 await more('Calendar');
 await page.getByRole('heading',{name:'Calendar & availability'}).waitFor();checks++;
 await more('Integrations');
 await click(page.getByRole('button',{name:'Video',exact:true}));
 await page.getByText('3 providers',{exact:true}).waitFor();checks++;
 await click(page.getByRole('button',{name:'All',exact:true}));
 await click(page.getByRole('link',{name:/Connection requirements/}).first());
 await page.getByRole('heading',{name:'Connection preparation'}).waitFor();checks++;
 await click(page.getByRole('link',{name:'Back to integrations'}));
 await more('Payments');await matches(23);
 await click(page.getByRole('button',{name:'Awaiting payment',exact:true}));await matches(5);
 await more('Reports');await page.getByRole('heading',{name:'Reports'}).waitFor();checks++;
 await more('Settings');await page.getByRole('heading',{name:'Settings'}).waitFor();checks++;
 await more('Get started');await page.getByRole('heading',{name:'Get started'}).waitFor();checks++;
 await visit('Home');
 await click(page.getByRole('link',{name:/Booking page/}).first());visited.push({name:'Public demo',path:new URL(page.url()).pathname});
 await page.getByRole('heading',{name:'Schedule an appointment'}).waitFor();checks++;
 await click(page.locator('button[aria-pressed][aria-label]:not(:disabled)').first());
 await click(page.getByRole('button',{name:'10:00',exact:true}));
 await click(page.getByRole('button',{name:/Continue/}));
 await fill(page.getByRole('textbox',{name:'Your name'}),'Demo Visitor');
 await fill(page.getByRole('textbox',{name:'Email address'}),'demo@example.invalid');
 await page.getByRole('button',{name:'Request appointment'}).isDisabled().then(v=>{if(!v)throw new Error('Demo cannot submit actual bookings');checks++});
 if(errors.length)throw Error(errors.join('; '));
 console.log('PASS Demo: '+interactions+' browser actions, '+checks+' checks, '+visited.length+' route visits; requests disabled');
 await fs.writeFile('browser-evidence/demo-summary.json',JSON.stringify({success:true,interactions,checks,visited,errors},null,2));
}catch(e){
 await fs.writeFile('browser-evidence/demo-summary.json',JSON.stringify({success:false,interactions,checks,visited,errors,error:String(e)},null,2));
 console.error(e);process.exitCode=1;
}finally{await context.close();await browser.close()}
