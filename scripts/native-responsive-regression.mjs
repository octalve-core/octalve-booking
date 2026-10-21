import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const base=process.env.BOOKING_BASE_URL??'http://127.0.0.1:3000';
const widths=[320,390,768,1440];
const browser=await chromium.launch({headless:true});
const failures=[],results=[];
await fs.mkdir('browser-evidence',{recursive:true});
for(const width of widths){
 const context=await browser.newContext({viewport:{width,height:850},deviceScaleFactor:1});
 const page=await context.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.goto(base+'/?preview=1',{waitUntil:'networkidle'});
  async function check(label){
   const value=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
   if(value.scroll>value.client+1)throw new Error(label+' horizontal overflow '+JSON.stringify(value));
  }
  await check('Dashboard');
  if(width<768){
   await page.getByRole('navigation',{name:'Mobile primary navigation'}).getByRole('link',{name:'Bookings'}).click();
   await check('Bookings');
   const menu=page.getByRole('button',{name:'BK-00084 options'});
   await menu.click();
   await page.getByRole('dialog',{name:'BK-00084 options'}).waitFor();
   await page.keyboard.press('Escape');
   if(await page.getByRole('dialog',{name:'BK-00084 options'}).count())throw new Error('Escape did not close action sheet');
   await menu.focus();await check('Action menu');
   await page.getByRole('navigation',{name:'Mobile primary navigation'}).getByRole('link',{name:'More'}).click();
   await page.getByRole('link',{name:'Calendar',exact:true}).click();
  }else{
   await page.getByRole('navigation',{name:'Desktop navigation'}).getByRole('link',{name:'Bookings'}).click();
   await check('Bookings');
   await page.getByRole('navigation',{name:'Desktop navigation'}).getByRole('link',{name:'Calendar'}).click();
  }
  await check('Calendar');
  await page.getByLabel('Exception date').fill('2026-12-25');
  await page.getByRole('button',{name:'Add exception'}).click();
  await check('Exception card');
  const report={width,errors,passed:errors.length===0};
  if(errors.length)throw new Error(errors.join('; '));
  await page.screenshot({path:'browser-evidence/responsive-'+width+'.png',fullPage:true});results.push(report);
 }catch(error){failures.push({width,error:String(error),errors});results.push({width,passed:false})}
 finally{await context.close()}
}
await browser.close();
await fs.writeFile('browser-evidence/responsive-results.json',JSON.stringify({widths,results,failures},null,2));
if(failures.length){console.error(JSON.stringify(failures,null,2));process.exitCode=1}else console.log('Responsive and keyboard checks passed at '+widths.join(', ')+' px');
