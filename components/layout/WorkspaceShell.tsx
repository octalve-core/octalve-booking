'use client';
import {type ReactNode,useState} from 'react';
import {usePathname,useSearchParams} from 'next/navigation';
import {CalendarCheck,CalendarDays,BriefcaseBusiness,ClipboardList,UsersRound,Wallet,PlugZap,ChartNoAxesCombined,ListChecks,Settings2,House,Grid2X2,UserRound,ChevronDown,ExternalLink,ShieldCheck,Search,X} from 'lucide-react';
import {BookingStore,useBookingStore} from '@/src/booking/store';
import {moduleRoutes} from '@/src/booking/routes';
import {AppLink} from '@/components/ui/Primitives';
const icons={LayoutDashboard:House,CalendarCheck,CalendarDays,BriefcaseBusiness,ClipboardList,UsersRound,Wallet,PlugZap,ChartNoAxesCombined,ListChecks,Settings2};

function WorkspaceSearch(){
 const {data}=useBookingStore();const [open,setOpen]=useState(false),[query,setQuery]=useState('');
 const entries=[
  ...moduleRoutes.map(r=>({name:r.label,detail:'Workspace page',href:r.href})),
  ...data.clients.map(c=>({name:c.name,detail:'Client · '+c.id+' · '+c.email,href:'/clients/'+c.id})),
  ...data.services.map(s=>({name:s.title,detail:'Service · '+s.id,href:'/services/'+s.id})),
  ...data.bookings.map(b=>({name:b.id,detail:'Booking · '+(data.clients.find(c=>c.id===b.clientId)?.name??'')+' · '+(data.services.find(s=>s.id===b.serviceId)?.title??''),href:'/bookings/'+b.id})),
  ...data.enquiries.map(e=>({name:e.subject,detail:'Enquiry · '+e.id+' · '+(data.clients.find(c=>c.id===e.clientId)?.name??''),href:'/enquiries/'+e.id}))
 ];
 const needle=query.trim().toLocaleLowerCase();
 const results=entries.filter(e=>!needle?e.detail==='Workspace page':(e.name+' '+e.detail).toLocaleLowerCase().includes(needle)).slice(0,20);
 const close=()=>{setOpen(false);setQuery('')};
 return <>
  <button type="button" aria-label="Search workspace" onClick={()=>setOpen(true)} className="hidden h-10 w-[440px] max-w-[32vw] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-left text-[12px] text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 lg:flex"><Search size={16}/>Search appointments, clients and services</button>
  <button type="button" aria-label="Search workspace" onClick={()=>setOpen(true)} className="grid size-10 shrink-0 place-items-center rounded-xl text-slate-500 hover:bg-blue-50 lg:hidden"><Search size={19}/></button>
  {open&&<div className="fixed inset-0 z-[110] flex items-start justify-center bg-slate-950/50 px-3 pt-[max(6vh,32px)]" onMouseDown={e=>{if(e.currentTarget===e.target)close()}}>
   <section role="dialog" aria-modal="true" aria-label="Workspace search" className="w-full max-w-xl rounded-2xl bg-white p-4 shadow-2xl" onKeyDown={e=>{if(e.key==='Escape')close()}}>
    <div className="mb-3 flex items-center justify-between gap-2"><h2 className="text-sm font-bold">Search workspace</h2><button type="button" aria-label="Close workspace search" onClick={close} className="grid size-10 place-items-center rounded-lg hover:bg-slate-100"><X size={18}/></button></div>
    <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3"><Search size={17} className="text-slate-400"/><input autoFocus aria-label="Search appointments, clients, services and enquiries" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Type a name, reference or page" className="h-12 w-full min-w-0 text-xs outline-none"/></label>
    <div role="status" aria-live="polite" className="py-3 text-[11px] text-slate-500">{results.length} matching destinations{!needle?' · Choose a workspace page':''}</div>
    <div className="max-h-[55vh] space-y-1 overflow-y-auto">{results.map(item=><AppLink key={item.href} href={item.href} onClick={close} className="block rounded-xl px-3 py-3 hover:bg-blue-50"><span className="block text-[12px] font-semibold text-[#193450]">{item.name}</span><span className="block truncate text-[10px] text-slate-500">{item.detail}</span></AppLink>)}{results.length===0&&<p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">No matching destinations. Try a client name, booking reference or module name.</p>}</div>
   </section>
  </div>}
 </>;
}

function Interior({children}:{children:ReactNode}){
 const pathname=usePathname();const [profile,setProfile]=useState(false);
 const primary=[{label:'Home',href:'/',icon:House},{label:'Bookings',href:'/bookings',icon:CalendarDays},{label:'Services',href:'/services',icon:BriefcaseBusiness},{label:'More',href:'/more',icon:Grid2X2},{label:'Account',href:'/account',icon:UserRound}];
 return <div className="min-h-svh bg-[#f8fafc]">
 <header className="fixed inset-x-0 top-0 z-40 flex h-[70px] items-center gap-3 border-b border-slate-100 bg-white px-4 md:gap-8 md:px-6"><AppLink href="/" className="flex shrink-0 items-center gap-2.5 md:w-[225px]"><span aria-hidden className="grid size-10 place-items-center rounded-[13px] bg-octal-blue text-white"><CalendarCheck size={24}/></span><span className="text-[18px] leading-4 font-extrabold tracking-tight">Octalve.<span className="mt-1 block text-[10px] font-bold tracking-[.17em] text-octal-blue">BOOKING</span></span></AppLink><WorkspaceSearch/><div className="flex-1"/><AppLink href="/b/octalve-studio" className="hidden items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] font-semibold text-octal-blue min-[350px]:flex"><ExternalLink size={15}/>Booking page</AppLink><button aria-expanded={profile} onClick={()=>setProfile(!profile)} aria-label="Account options" className="flex shrink-0 items-center gap-2"><span className="grid size-9 place-items-center rounded-full bg-blue-50 text-[11px] font-extrabold text-octal-blue">OA</span><span className="hidden text-left text-[11px] font-semibold md:block">Octalve Studio<span className="block text-[10px] font-normal text-slate-400">Workspace</span></span><ChevronDown size={15}/></button>{profile&&<div className="absolute top-[64px] right-3 w-52 rounded-2xl border border-slate-100 bg-white p-2 shadow-lg"><AppLink href="/account" onClick={()=>setProfile(false)} className="block rounded-xl px-3 py-3 text-[12px] font-semibold hover:bg-slate-50">Account & profile</AppLink><AppLink href="/settings" onClick={()=>setProfile(false)} className="block rounded-xl px-3 py-3 text-[12px] font-semibold hover:bg-slate-50">Workspace settings</AppLink><p className="m-1 border-t p-2 text-[10px] leading-4 text-slate-400">Authentication is not active yet.</p></div>}</header>
 <aside className="fixed top-[70px] bottom-0 left-0 z-30 hidden w-[256px] flex-col overflow-y-auto bg-octal-navy px-3 py-4 text-[#acbdd2] md:flex"><div className="mb-5 rounded-xl border border-[#26364a] bg-[#101e2e] p-3.5"><span className="block text-[9px] tracking-[.16em] text-slate-400">YOUR WORKSPACE</span><strong className="mt-2 block text-[12px] text-white">Octalve Studio</strong><span className="mt-1 flex gap-1 text-[10px] text-slate-400">Africa/Lagos · NGN</span></div><p className="px-3 pb-3 text-[9px] font-bold tracking-[.15em] text-slate-500">WORKSPACE</p><nav aria-label="Desktop navigation" className="grid gap-1">{moduleRoutes.slice(0,9).map(r=>{const Icon=icons[r.icon];const active=r.href==='/'?pathname==='/':pathname.startsWith(r.href);return <AppLink href={r.href} key={r.href} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-[12px] font-semibold transition ${active?'bg-octal-blue text-white':'text-[#aebdd0] hover:bg-[#132237] hover:text-white'}`}><Icon size={17} strokeWidth={1.7}/>{r.label}</AppLink>})}</nav><div className="mt-auto border-t border-[#203149] pt-4"><p className="px-3 pb-2 text-[9px] tracking-widest text-slate-500">ACCOUNT</p>{moduleRoutes.slice(9).map(r=>{const Icon=icons[r.icon];return <AppLink key={r.href} href={r.href} className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-[12px] hover:bg-[#132237]"><Icon size={17}/>{r.label}</AppLink>})}<div className="mt-4 rounded-xl border border-[#263d55] bg-[#0d2034] p-3 text-[11px] font-semibold text-white"><ShieldCheck size={17} className="mb-2 text-blue-300"/>Octalve Booking<p className="mt-1 text-[10px] font-normal text-slate-400">Your time, better managed.</p></div></div></aside>
 <main id="main-content" className="min-w-0 px-4 pt-[98px] pb-[105px] md:ml-[256px] md:px-7 md:pb-10 xl:px-9"><div className="mx-auto w-full max-w-[1530px]">{children}</div></main>
 <nav aria-label="Mobile primary navigation" className="fixed inset-x-0 bottom-0 z-40 grid h-[76px] grid-cols-5 border-t border-slate-100 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">{primary.map(a=>{const Icon=a.icon;const active=a.href==='/'?pathname==='/':pathname.startsWith(a.href);return <AppLink key={a.href} href={a.href} className={`flex flex-col items-center justify-center gap-1 text-[10px] ${active?'font-bold text-octal-blue':'text-slate-500'}`}><span className={`grid size-9 place-items-center rounded-xl ${active?'bg-blue-50':''}`}><Icon size={22} strokeWidth={active?2.1:1.8}/></span>{a.label}</AppLink>})}</nav>
 </div>
}
export function WorkspaceShell({children}:{children:ReactNode}){
 const search=useSearchParams();const preview=search.get('preview')==='1';return <BookingStore key={preview?'preview':'connected'} preview={preview}><Interior>{children}</Interior></BookingStore>;
}
