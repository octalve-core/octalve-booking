'use client';
import {useSearchParams} from 'next/navigation';
import {useState,type FormEvent} from 'react';
import Link from 'next/link';
export function TokenAction({purpose}:{purpose:'verify'|'reset'}){
 const params=useSearchParams();
 const token=params.get('token')??'';
 const [password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[message,setMessage]=useState('');
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  if(!/^[A-Za-z0-9_-]{43}$/.test(token)){setMessage('The link is invalid. Request a new one.');return}
  if(purpose==='reset'&&(password.length<15||password!==confirm)){setMessage('Use at least 15 characters and matching passwords.');return}
  try{
   const res=await fetch(purpose==='verify'?'/api/v1/auth/verify-email':'/api/v1/auth/reset-password',{
    method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},
    body:JSON.stringify(purpose==='verify'?{token}:{token,password})
   });
   setMessage(res.ok?(purpose==='verify'?'Your email is verified. You can sign in.':'Password updated. Please sign in again.'):'The link is invalid, expired or the service is not yet available.');
  }catch{setMessage('Account service temporarily unavailable.')}
  setPassword('');setConfirm('');
 }
 return <main className="grid min-h-svh place-items-center bg-[#f5f9ff] p-4">
  <section className="w-full max-w-[440px] rounded-2xl bg-white p-7 shadow-sm">
   <h1 className="text-xl font-extrabold text-[#193450]">{purpose==='verify'?'Verify your email':'Create a new password'}</h1>
   <p className="mt-2 text-xs text-slate-500">Octalve Booking account security</p>
   <form onSubmit={submit} className="mt-5 space-y-3">
    {purpose==='reset'&&<>
     <label className="block text-xs font-semibold">New password<input type="password" autoComplete="new-password" required minLength={15} value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3"/></label>
     <label className="block text-xs font-semibold">Confirm password<input type="password" autoComplete="new-password" required minLength={15} value={confirm} onChange={e=>setConfirm(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3"/></label>
    </>}
    <p role="status" aria-live="polite" className="text-xs text-[#5d7189]">{message}</p>
    <button type="submit" className="h-11 w-full rounded-xl bg-[#0064E0] text-sm font-bold text-white">{purpose==='verify'?'Verify email':'Update password'}</button>
   </form>
   <Link href="/signin" className="mt-5 block text-center text-xs font-semibold text-[#0064E0]">Back to sign in</Link>
  </section>
 </main>;
}
