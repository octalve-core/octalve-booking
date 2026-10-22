'use client';
import {useEffect,useState,type FormEvent} from 'react';
import Link from 'next/link';
type Workspace={id:string;name:string;kind:'individual'|'business';role:string;timezone:string;currency:string;website:string|null};
type Profile={userId:string;fullName:string;email:string;phoneE164:string|null;workspaces:Workspace[]};
type Loading='loading'|'ready'|'disabled'|'unauthorized'|'error';
const field='mt-1.5 w-full rounded-xl border border-[#e1eaf5] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#0064E0] focus:ring-2 focus:ring-blue-100';
async function send(path:string,method:string,body:object){
 const response=await fetch(path,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store',credentials:'same-origin'});
 return {ok:response.ok,status:response.status};
}
export default function AccountPage(){
 const [status,setStatus]=useState<Loading>('loading'),[profile,setProfile]=useState<Profile|null>(null);
 const [name,setName]=useState(''),[phone,setPhone]=useState(''),[message,setMessage]=useState('');
 const [workspaceId,setWorkspaceId]=useState(''),[businessName,setBusinessName]=useState(''),[site,setSite]=useState(''),[timezone,setTimezone]=useState('Africa/Lagos'),[currency,setCurrency]=useState('NGN');
 const [oldPassword,setOldPassword]=useState(''),[newPassword,setNewPassword]=useState(''),[busy,setBusy]=useState(false);
 async function refresh(){
  try{
   const r=await fetch('/api/v1/auth/me',{cache:'no-store',credentials:'same-origin'});
   if(r.status===503){setStatus('disabled');return}
   if(r.status===401){setStatus('unauthorized');return}
   if(!r.ok){setStatus('error');return}
   const data=await r.json() as {profile:Profile};
   setProfile(data.profile);setName(data.profile.fullName);setPhone(data.profile.phoneE164??'');
   setStatus('ready');
  }catch{setStatus('error')}
 }
 useEffect(()=>{void refresh()},[]);
 const workspace=profile?.workspaces.find(w=>w.id===workspaceId)??profile?.workspaces[0];
 useEffect(()=>{if(!workspace)return;setWorkspaceId(workspace.id);setBusinessName(workspace.name);setSite(workspace.website??'');setTimezone(workspace.timezone);setCurrency(workspace.currency)},[workspace?.id,profile]);
 async function saveProfile(e:FormEvent){e.preventDefault();if(busy)return;setBusy(true);setMessage('');
  try{const r=await send('/api/v1/auth/me','PATCH',{fullName:name,phoneE164:phone||null});setMessage(r.ok?'Account details saved.':'Unable to save account details.');if(r.ok)await refresh()}catch{setMessage('Connection unavailable.')}finally{setBusy(false)}
 }
 async function saveBusiness(e:FormEvent){e.preventDefault();if(busy||!workspace)return;setBusy(true);setMessage('');
  try{const r=await send('/api/v1/auth/business','PATCH',{workspaceId:workspace.id,name:businessName,website:site||null,timezone,currency});setMessage(r.ok?'Business details saved.':'Only an active workspace owner can update these details.');if(r.ok)await refresh()}catch{setMessage('Connection unavailable.')}finally{setBusy(false)}
 }
 async function savePassword(e:FormEvent){e.preventDefault();if(busy)return;setBusy(true);setMessage('');
  try{const r=await send('/api/v1/auth/change-password','POST',{currentPassword:oldPassword,newPassword});setMessage(r.ok?'Password changed. All sessions have been signed out. Sign in again.':'Password change could not be completed. Check your current and new passwords.');if(r.ok){setStatus('unauthorized')}}catch{setMessage('Connection unavailable.')}finally{setOldPassword('');setNewPassword('');setBusy(false)}
 }
 return <main className="min-h-svh bg-[#f5f9ff] px-4 py-7 text-[#172e49] sm:px-7">
  <div className="mx-auto max-w-3xl space-y-5">
   <header className="flex items-center justify-between gap-3"><div><Link href="/" className="text-sm font-semibold text-[#0064E0]">Octalve Booking</Link><h1 className="mt-2 text-2xl font-semibold">Account settings</h1></div><Link href="/" className="text-xs font-medium text-[#0064E0]">Back to workspace</Link></header>
   {status!=='ready'&&<section className="rounded-2xl border border-[#e1eaf5] bg-white p-7 text-sm text-[#627891]">{status==='loading'?'Checking your account…':status==='disabled'?'Account services are not configured in this environment.':status==='unauthorized'?<>Sign in to manage your account. <Link className="font-semibold text-[#0064E0]" href="/signin">Go to sign in</Link></>:'Unable to load account settings.'}</section>}
   {message&&<p role="status" className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-[#245080]">{message}</p>}
   {status==='ready'&&profile&&<div className="space-y-5">
    <form onSubmit={saveProfile} className="rounded-2xl border border-[#e1eaf5] bg-white p-6 shadow-sm"><h2 className="text-base font-semibold">Personal information</h2><p className="mt-1 text-xs text-[#8092a8]">Email changes require a separate verified recovery process.</p><div className="mt-4 grid gap-4 sm:grid-cols-2">
     <label className="block text-xs font-medium">Full name<input className={field} required maxLength={120} value={name} onChange={e=>setName(e.target.value)}/></label>
     <label className="block text-xs font-medium">Email<input className={field} disabled readOnly value={profile.email}/></label>
     <label className="block text-xs font-medium sm:col-span-2">Phone number (optional, international E.164)<input className={field} type="tel" placeholder="+2348012345678" value={phone} onChange={e=>setPhone(e.target.value)}/></label>
    </div><button disabled={busy} className="mt-5 rounded-xl bg-[#0064E0] px-4 py-3 text-xs font-semibold text-white disabled:opacity-50">Save personal details</button></form>
    <form onSubmit={saveBusiness} className="rounded-2xl border border-[#e1eaf5] bg-white p-6 shadow-sm"><h2 className="text-base font-semibold">Workspace identity</h2>
     <label className="mt-4 block text-xs font-medium">Workspace<select className={field} value={workspace?.id??''} onChange={e=>setWorkspaceId(e.target.value)}>{profile.workspaces.map(w=><option key={w.id} value={w.id}>{w.name} · {w.role}</option>)}</select></label>
     <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <label className="block text-xs font-medium">Business name<input className={field} required value={businessName} onChange={e=>setBusinessName(e.target.value)}/></label>
      <label className="block text-xs font-medium">Website (optional)<input className={field} type="url" placeholder="https://example.com" value={site} onChange={e=>setSite(e.target.value)}/></label>
      <label className="block text-xs font-medium">Timezone<input className={field} value={timezone} onChange={e=>setTimezone(e.target.value)}/></label>
      <label className="block text-xs font-medium">Currency<input className={field} value={currency} onChange={e=>setCurrency(e.target.value.toUpperCase())} maxLength={3}/></label>
     </div><button disabled={busy||workspace?.role!=='owner'} className="mt-5 rounded-xl bg-[#0064E0] px-4 py-3 text-xs font-semibold text-white disabled:opacity-50">Save workspace details</button>
    </form>
    <form onSubmit={savePassword} className="rounded-2xl border border-[#e1eaf5] bg-white p-6 shadow-sm"><h2 className="text-base font-semibold">Change password</h2><p className="mt-1 text-xs text-[#8092a8]">Changing your password signs out every session.</p>
     <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="block text-xs font-medium">Current password<input className={field} type="password" autoComplete="current-password" required value={oldPassword} onChange={e=>setOldPassword(e.target.value)}/></label><label className="block text-xs font-medium">New password (15–128 characters)<input className={field} type="password" autoComplete="new-password" required minLength={15} maxLength={128} value={newPassword} onChange={e=>setNewPassword(e.target.value)}/></label></div>
     <button disabled={busy} className="mt-5 rounded-xl bg-[#0064E0] px-4 py-3 text-xs font-semibold text-white disabled:opacity-50">Change password</button>
    </form></div>}
  </div>
 </main>
}
