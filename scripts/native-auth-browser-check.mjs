import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const browser=await chromium.launch({headless:true});
const base=process.env.BOOKING_BASE_URL??'http://127.0.0.1:3000';
const widths=[320,390,768,1440],results=[],failures=[];
await fs.mkdir('browser-evidence',{recursive:true});
for(const width of widths){
 const context=await browser.newContext({viewport:{width,height:width===1440?520:850}});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 const step=async(locator)=>locator.click({timeout:12000});
 try{
  await page.goto(base+'/?preview=1',{waitUntil:'networkidle'});
  if(width<768){await step(page.getByRole('navigation',{name:'Mobile primary navigation'}).getByRole('link',{name:'Account'}));await step(page.getByRole('link',{name:'Sign in'}))}
  else {await step(page.getByRole('button',{name:'Account options'}));await step(page.getByRole('link',{name:'Sign in'}))}
  await page.getByRole('heading',{name:'Welcome back!'}).waitFor();
  await page.getByRole('textbox',{name:'Email address'}).fill('review@example.invalid');
  await page.getByLabel('Password',{exact:true}).fill('NotASubmittedPassword123!');
  await step(page.getByRole('button',{name:'Show password'}));
  if(await page.getByLabel('Password',{exact:true}).getAttribute('type')!=='text')throw Error('Show password did not work');
  await step(page.getByRole('button',{name:'Hide password'}));
  await page.getByRole('checkbox',{name:'Remember me'}).check();
  await step(page.getByRole('button',{name:'Sign in',exact:true}));
  await page.getByText('No credentials were sent or saved.',{exact:false}).waitFor();
  if(await page.getByLabel('Password',{exact:true}).inputValue())throw Error('Password field must clear after attempted sign-in');
  await step(page.getByRole('link',{name:'Forgot password?'}));
  await page.getByRole('heading',{name:'Reset your password'}).waitFor();
  await page.getByRole('textbox',{name:'Email address'}).fill('review@example.invalid');
  await step(page.getByRole('button',{name:'Send reset link'}));
  await page.getByText('No reset email was sent.',{exact:false}).waitFor();
  await step(page.getByRole('link',{name:'Back to sign in'}));
  await step(page.getByRole('link',{name:'Create an account'}));
  await page.getByRole('heading',{name:'Create your booking workspace'}).waitFor();
  const country=page.getByRole('combobox',{name:'Country dialing code'});
  await country.selectOption('GB');
  await page.getByText('Selected: +44.',{exact:false}).waitFor();
  await page.getByRole('radio',{name:'Just me'}).check();
  await step(page.getByRole('button',{name:'Add details'}));
  await page.getByRole('combobox',{name:'Timezone'}).selectOption('Europe/London');
  await step(page.getByRole('button',{name:'Hide'}));
  await page.getByRole('radio',{name:'Business / team'}).check();
  await step(page.getByRole('button',{name:'Add details'}));
  await page.getByRole('textbox',{name:'Business name'}).fill('Demo Advisory');
  await page.getByRole('textbox',{name:'Full name'}).fill('Sample Reviewer');
  await page.getByRole('textbox',{name:'Email address'}).fill('review@example.invalid');
  await page.getByRole('textbox',{name:'Local phone number'}).fill('7700900123');
  await page.getByLabel('Create password',{exact:true}).fill('StrongerPassword123');
  await page.getByLabel('Confirm password',{exact:true}).fill('DifferentPassword123');
  await page.getByRole('checkbox',{name:/I have reviewed/}).check();
  await step(page.getByRole('button',{name:'Create account',exact:true}));
  await page.getByText('Passwords do not match.',{exact:true}).waitFor();
  await page.getByLabel('Confirm password',{exact:true}).fill('StrongerPassword123');
  await step(page.getByRole('button',{name:'Create account',exact:true}));
  await page.getByText('No account, password or phone number was submitted or stored.',{exact:false}).waitFor();
  if(await page.getByLabel('Create password',{exact:true}).inputValue())throw Error('Password must clear after signup submit');
  await step(page.getByRole('link',{name:'Privacy notice'}));
  await page.getByRole('heading',{name:'Privacy — preparation notice'}).waitFor();
  await step(page.getByRole('link',{name:'Back to sign up'}));
  await step(page.getByRole('link',{name:'Terms'}));
  await page.getByRole('heading',{name:'Terms — preparation notice'}).waitFor();
  await step(page.getByRole('link',{name:'Back to sign up'}));
  await step(page.getByRole('link',{name:'Back to workspace'}));
  if(width===1440){
   const aside=page.locator('aside');
   const state=await aside.evaluate(e=>({overflow:getComputedStyle(e).overflowY,scrollbar:getComputedStyle(e).scrollbarWidth,height:e.clientHeight,content:e.scrollHeight}));
   if(state.overflow!=='auto'||state.scrollbar!=='none')throw Error('Sidebar must scroll without displaying track: '+JSON.stringify(state));
   await aside.hover();await page.mouse.wheel(0,500);
   const scrolled=await aside.evaluate(e=>e.scrollTop);
   if(state.content>state.height&&scrolled<1)throw Error('Wheel cannot scroll hidden-scrollbar sidebar');
  }
  const doc=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
  if(doc.scroll>doc.client+1)throw Error('Horizontal overflow at '+width+'px: '+JSON.stringify(doc));
  if(errors.length)throw Error(errors.join('; '));
  results.push({width,passed:true,errors:0});
 }catch(e){failures.push({width,error:String(e),errors});results.push({width,passed:false})}
 finally{await context.close()}
}
await browser.close();
await fs.writeFile('browser-evidence/auth-regression.json',JSON.stringify({results,failures},null,2));
if(failures.length){console.error(JSON.stringify(failures,null,2));process.exitCode=1}
else console.log('PASS auth forms and hidden-scrollbar sidebar at '+widths.join(', ')+' px');
