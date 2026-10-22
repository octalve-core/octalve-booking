'use client';
import Link from 'next/link';
import {useRouter,useSearchParams} from 'next/navigation';
import {useEffect,useState,type FormEvent,type ReactNode} from 'react';
import {ArrowLeft,ArrowRight,CalendarCheck,Eye,EyeOff,Mail} from 'lucide-react';

type AuthMode='signin'|'signup'|'reset';
function useAccountServiceReady():boolean{
 const [ready,setReady]=useState(false);
 useEffect(()=>{
  let active=true;
  fetch('/api/v1/auth/status',{cache:'no-store'}).then(async response=>{
   if(!response.ok)return;
   const data=await response.json() as {available?:boolean};
   if(active)setReady(data.available===true);
  }).catch(()=>{});
  return ()=>{active=false};
 },[]);
 return ready;
}
async function postAccount(path:string,data:Record<string,unknown>):Promise<boolean>{
 try{
  const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),cache:'no-store'});
  return response.ok;
 }catch{return false}
}
const field='mt-1.5 h-11 w-full rounded-xl border border-[#e3e9f1] bg-white px-3.5 text-[13px] text-[#213854] outline-none transition placeholder:text-slate-400 focus:border-[#0064E0] focus:ring-2 focus:ring-blue-100';
const countryCodes=[
 ['Nigeria','NG','+234'],['Ghana','GH','+233'],['United Kingdom','GB','+44'],['United States','US','+1'],['Canada','CA','+1'],['South Africa','ZA','+27'],['Kenya','KE','+254'],['Uganda','UG','+256'],['Tanzania','TZ','+255'],['Rwanda','RW','+250'],['Cameroon','CM','+237'],['Benin','BJ','+229'],['Togo','TG','+228'],['Niger','NE','+227'],['Senegal','SN','+221'],['Côte d’Ivoire','CI','+225'],['Egypt','EG','+20'],['Morocco','MA','+212'],['Ethiopia','ET','+251'],['United Arab Emirates','AE','+971'],['Saudi Arabia','SA','+966'],['Qatar','QA','+974'],['India','IN','+91'],['Pakistan','PK','+92'],['China','CN','+86'],['Japan','JP','+81'],['Australia','AU','+61'],['New Zealand','NZ','+64'],['Germany','DE','+49'],['France','FR','+33'],['Netherlands','NL','+31'],['Belgium','BE','+32'],['Ireland','IE','+353'],['Italy','IT','+39'],['Spain','ES','+34'],['Portugal','PT','+351'],['Brazil','BR','+55'],['Mexico','MX','+52'],['Turkey','TR','+90'],['Indonesia','ID','+62'],['Malaysia','MY','+60'],['Singapore','SG','+65'],['Philippines','PH','+63']
] as const;
function Brand({returnHref}:{returnHref:string}){return <Link href={returnHref} className="inline-flex items-center gap-2.5 text-[#1b3654]" aria-label="Octalve Booking home"><span className="grid size-9 place-items-center rounded-xl bg-[#0064E0] text-white"><CalendarCheck size={21}/></span><span className="text-[17px] font-extrabold tracking-tight">Octalve<span className="text-[#0064E0]"> Booking</span></span></Link>}
function AuthShell({children,wide=false,returnHref='/'}:{children:ReactNode;wide?:boolean;returnHref?:string}) {
 return <main className="min-h-svh bg-[#f5f9ff] px-3 py-4 text-[#1c3552] sm:px-6 sm:py-7">
  <div className="mx-auto flex min-h-[calc(100svh-32px)] max-w-[1180px] flex-col rounded-[22px] border border-[#eaf1fa] bg-[#fbfdff] px-4 py-5 sm:min-h-[calc(100svh-56px)] sm:rounded-[30px] sm:px-9 sm:py-7">
   <div className="flex items-center justify-between gap-3"><Link href={returnHref} className="inline-flex min-h-11 items-center gap-1.5 text-[12px] font-semibold text-[#526986] hover:text-[#0064E0]"><ArrowLeft size={15}/>Back to workspace</Link><span className="hidden text-[11px] font-medium text-[#91a2b7] sm:block">Simple scheduling. Better experiences.</span></div>
   <div className="flex flex-1 flex-col items-center justify-center gap-5 py-5 sm:py-8"><Brand returnHref={returnHref}/>
    <section className={`w-full rounded-[19px] border border-[#edf0f6] bg-white px-5 py-7 shadow-[0_13px_42px_rgba(31,69,117,0.07)] sm:px-9 sm:py-8 ${wide?'max-w-[600px]':'max-w-[426px]'}`}>{children}</section>
    <p className="text-center text-[11px] text-[#9aa8b9]">© Octalve Booking · Designed for your time</p>
   </div>
  </div>
 </main>;
}
function Field({label,children,optional=false}:{label:string;children:ReactNode;optional?:boolean}){return <label className="block text-[12px] font-semibold text-[#344b67]">{label}{optional&&<span className="ml-1 font-normal text-slate-400">(optional)</span>}{children}</label>}
function PasswordField({label,value,onChange,autoComplete='new-password',minLength}:{label:string;value:string;onChange:(value:string)=>void;autoComplete?:string;minLength?:number}){
 const [visible,setVisible]=useState(false);
 return <Field label={label}><div className="relative mt-1.5"><input className={field+' mt-0 pr-12'} aria-label={label} type={visible?'text':'password'} value={value} onChange={e=>onChange(e.target.value)} required minLength={minLength} autoComplete={autoComplete} placeholder="Enter your password"/><button type="button" aria-label={visible?'Hide '+label.toLowerCase():'Show '+label.toLowerCase()} aria-pressed={visible} onClick={()=>setVisible(x=>!x)} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-400 hover:text-[#0064E0]">{visible?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></Field>;
}
function FormNotice({message}:{message:string}){return message?<p role="status" aria-live="polite" className="rounded-xl border border-[#d9e8fd] bg-[#f2f7ff] p-3 text-[12px] leading-5 text-[#264f85]">{message}</p>:null}
function Heading({title,description}:{title:string;description:string}){return <div className="mb-6 text-center"><h1 className="text-[22px] font-extrabold tracking-tight text-[#163250]">{title}</h1><p className="mt-2 text-[12px] leading-5 text-[#8192a7]">{description}</p></div>}
function SignIn({suffix}:{suffix:string}){
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[remember,setRemember]=useState(false),[message,setMessage]=useState('');
 const enabled=useAccountServiceReady();
 const router=useRouter();
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  if(!enabled){setPassword('');setMessage('Account sign-in is being connected to secure authentication. No credentials were sent or saved.');return;}
  const ok=await postAccount('/api/v1/auth/login',{email,password});
  setPassword('');
  setMessage(ok?'Signed in successfully.':'Unable to sign in. Check your account and email verification.');
  if(ok)router.replace('/account/security');
 }
 return <AuthShell returnHref={'/'+suffix}><Heading title="Welcome back!" description="Sign in to manage your appointments and clients."/>
  <form onSubmit={submit} className="space-y-4"><Field label="Email address"><input className={field} type="email" autoComplete="username" required aria-label="Email address" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@business.com"/></Field>
   <PasswordField label="Password" value={password} onChange={setPassword} autoComplete="current-password"/>
   <div className="flex flex-wrap items-center justify-between gap-2"><label className="flex items-center gap-2 text-[11px] font-medium text-[#677b94]"><input type="checkbox" className="size-4 accent-[#0064E0]" checked={remember} onChange={e=>setRemember(e.target.checked)}/>Remember me</label><Link href={"/forgot-password"+suffix} className="text-[11px] font-semibold text-[#0064E0] hover:underline">Forgot password?</Link></div>
   <FormNotice message={message}/><button type="submit" className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0064E0] text-[12px] font-bold text-white transition hover:bg-[#0052B8]">Sign in<ArrowRight size={15}/></button>
  </form>
  <button type="button" disabled aria-label="Continue with Google - not yet connected" className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#e2e8f0] text-[12px] font-semibold text-slate-500 opacity-70"><span aria-hidden className="text-[17px] font-extrabold text-[#4285F4]">G</span>Continue with Google (coming soon)</button>
  <p className="mt-6 text-center text-[12px] text-[#8391a4]">New to Octalve Booking? <Link href={"/signup"+suffix} className="font-bold text-[#0064E0] hover:underline">Create an account</Link></p>
 </AuthShell>;
}
function SignUp({suffix}:{suffix:string}){
 const [kind,setKind]=useState<'Business'|'Individual'>('Business'),[fullName,setFullName]=useState(''),[email,setEmail]=useState(''),[country,setCountry]=useState('NG'),[phone,setPhone]=useState('');
 const [password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[expanded,setExpanded]=useState(false),[businessName,setBusinessName]=useState(''),[website,setWebsite]=useState(''),[timezone,setTimezone]=useState('Africa/Lagos'),[currency,setCurrency]=useState('NGN'),[agreed,setAgreed]=useState(false),[message,setMessage]=useState('');
 const code=countryCodes.find(c=>c[1]===country)?.[2]??'+234';
 const validPass=password.length>=15&&password.length<=128;
 const enabled=useAccountServiceReady();
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  const digits=phone.replace(/\D/g,'').replace(/^0/,'');
  if(phone&&(!/^\d+$/.test(phone)||digits.length<6||digits.length>14)){setMessage('Enter a valid local phone number.');return;}
  if(!validPass){setMessage('Use a password of at least 15 characters.');return;}
  if(password!==confirm){setMessage('Passwords do not match.');return;}
  if(!agreed){setMessage('Please review the privacy and terms notices first.');return;}
  if(!enabled){setPassword('');setConfirm('');setMessage('The account form is ready for backend connection. No account, password or phone number was submitted or stored.');return;}
  const ok=await postAccount('/api/v1/auth/register',{kind:kind.toLowerCase(),fullName,email,password,phoneE164:phone?code+digits:undefined,businessName:businessName||undefined,website:website||undefined,timezone,currency});
  setPassword('');setConfirm('');
  setMessage(ok?'Check your inbox for a verification link.':'Unable to register. Check your details or try again.');
 }
 return <AuthShell wide returnHref={'/'+suffix}><Heading title="Create your booking workspace" description="A few details to get started. Set up the rest whenever you're ready."/>
  <form onSubmit={submit} className="space-y-4">
   <fieldset><legend className="mb-2 text-[12px] font-semibold text-[#344b67]">Workspace type</legend><div className="grid grid-cols-2 gap-2">{(['Business','Individual'] as const).map(v=><label key={v} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 text-[12px] font-semibold transition ${kind===v?'border-[#0064E0] bg-[#f3f8ff] text-[#0064E0]':'border-[#e4eaf2] text-[#667d97] hover:border-[#b7cee9]'}`}><input type="radio" name="workspaceType" value={v} checked={kind===v} onChange={()=>setKind(v)} className="size-4 accent-[#0064E0]"/>{v==='Business'?'Business / team':'Just me'}</label>)}</div></fieldset>
   <div className="grid gap-4 sm:grid-cols-2"><Field label="Full name"><input className={field} aria-label="Full name" autoComplete="name" required maxLength={120} value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Your full name"/></Field><Field label="Email address"><input className={field} aria-label="Email address" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@business.com"/></Field></div>
   <div><p className="mb-1.5 text-[12px] font-semibold text-[#344b67]">Phone number <span className="font-normal text-slate-400">(optional)</span></p><div className="grid grid-cols-[140px_minmax(0,1fr)] gap-2 sm:grid-cols-[190px_minmax(0,1fr)]"><label className="min-w-0"><span className="sr-only">Country dialing code</span><select aria-label="Country dialing code" className={field+' mt-0 min-w-0'} value={country} onChange={e=>setCountry(e.target.value)}>{countryCodes.map(([name,iso,dial])=><option key={iso} value={iso}>{iso} {dial} · {name}</option>)}</select></label><label className="min-w-0"><span className="sr-only">Local phone number</span><input aria-label="Local phone number" className={field+' mt-0'} type="tel" inputMode="tel" autoComplete="tel-national" value={phone} onChange={e=>setPhone(e.target.value.replace(/[\s()-]/g,''))} placeholder="Local number, e.g. 8012345678"/></label></div><p className="mt-1.5 text-[10px] text-[#8d9bb0]">Selected: {code}. Number verification will follow during account setup.</p></div>
   <div className="grid gap-4 sm:grid-cols-2"><PasswordField label="Create password" value={password} onChange={setPassword} minLength={15}/><PasswordField label="Confirm password" value={confirm} onChange={setConfirm} minLength={15}/></div>
   <p role="status" className={`text-[11px] ${password&&validPass?'text-emerald-700':'text-[#8295ac]'}`}>{password&&validPass?'Password length and format look good.':'Use 15–128 characters. Spaces and passphrases are welcome.'}</p>
   <section className="rounded-xl border border-[#e7edf5] bg-[#fbfcff] p-3.5"><div className="flex items-center justify-between gap-3"><div><h2 className="text-[12px] font-bold text-[#2a4462]">{kind==='Business'?'Business details':'Workspace preferences'} <span className="font-normal text-slate-400">· optional</span></h2><p className="mt-1 text-[11px] text-[#8495a9]">You can finish these in Get started.</p></div><button type="button" aria-expanded={expanded} aria-controls="signup-optional-details" onClick={()=>setExpanded(x=>!x)} className="min-h-10 shrink-0 rounded-lg px-3 text-[11px] font-bold text-[#0064E0] hover:bg-blue-50">{expanded?'Hide':'Add details'}</button></div>
    {expanded&&<div id="signup-optional-details" className="mt-4 grid gap-3 sm:grid-cols-2">{kind==='Business'&&<><Field label="Business name" optional><input className={field} aria-label="Business name" value={businessName} onChange={e=>setBusinessName(e.target.value)} maxLength={120} placeholder="Business name"/></Field><Field label="Website" optional><input className={field} aria-label="Website" type="url" value={website} onChange={e=>setWebsite(e.target.value)} placeholder="https://example.com"/></Field></>}<Field label="Timezone"><select className={field} aria-label="Timezone" value={timezone} onChange={e=>setTimezone(e.target.value)}>{['Africa/Lagos','Africa/Accra','Africa/Johannesburg','Europe/London','Europe/Paris','America/New_York','America/Los_Angeles','Asia/Dubai','Asia/Kolkata','UTC'].map(v=><option key={v}>{v}</option>)}</select></Field><Field label="Currency"><select className={field} aria-label="Currency" value={currency} onChange={e=>setCurrency(e.target.value)}>{['NGN','USD','GBP','EUR','GHS','ZAR','KES','AED','CAD','AUD'].map(v=><option key={v}>{v}</option>)}</select></Field></div>}
   </section>
   <label className="flex items-start gap-2.5 text-[11px] leading-5 text-[#667c95]"><input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)} required className="mt-1 size-4 shrink-0 accent-[#0064E0]"/><span>I have reviewed the <Link href={"/terms"+suffix} className="font-semibold text-[#0064E0] hover:underline">Terms</Link> and <Link href={"/privacy"+suffix} className="font-semibold text-[#0064E0] hover:underline">Privacy notice</Link>. Registration will open once policies and secure accounts are enabled.</span></label>
   <FormNotice message={message}/>
   <button type="submit" className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0064E0] text-[12px] font-bold text-white transition hover:bg-[#0052B8]">Create account<ArrowRight size={15}/></button>
  </form><p className="mt-5 text-center text-[12px] text-[#8391a4]">Already have an account? <Link href={"/signin"+suffix} className="font-bold text-[#0064E0] hover:underline">Sign in</Link></p>
 </AuthShell>;
}
function Reset({suffix}:{suffix:string}){
 const [email,setEmail]=useState(''),[message,setMessage]=useState('');
 const enabled=useAccountServiceReady();
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  if(!enabled){setMessage('Password recovery will be enabled with secure account email delivery. No reset email was sent.');return;}
  await postAccount('/api/v1/auth/forgot-password',{email});
  setMessage('If this account exists, password recovery instructions will arrive by email.');
 }
 return <AuthShell returnHref={'/'+suffix}><Heading title="Reset your password" description="Enter your account email to request a password reset."/><form onSubmit={submit} className="space-y-4"><Field label="Email address"><input aria-label="Email address" className={field} type="email" required autoComplete="email" placeholder="you@business.com" value={email} onChange={e=>setEmail(e.target.value)}/></Field><FormNotice message={message}/><button type="submit" className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0064E0] text-xs font-bold text-white hover:bg-[#0052B8]">Send reset link<Mail size={16}/></button></form><Link href={"/signin"+suffix} className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-[#0064E0] hover:underline"><ArrowLeft size={15}/>Back to sign in</Link></AuthShell>;
}
export function AuthPage({mode}:{mode:AuthMode}){const params=useSearchParams();const suffix=params.get('preview')==='1'?'?preview=1':'';return mode==='signin'?<SignIn suffix={suffix}/>:mode==='signup'?<SignUp suffix={suffix}/>:<Reset suffix={suffix}/>;}
