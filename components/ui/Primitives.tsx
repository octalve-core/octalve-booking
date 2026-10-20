'use client';
import Link from 'next/link';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {X,EllipsisVertical,ChevronRight,Search,ArrowLeft,Info,type LucideIcon} from 'lucide-react';
import {useBookingStore} from '@/src/booking/store';
import {previewHref} from '@/src/booking/routes';

export function AppLink({href,children,className,onClick}:{href:string;children:ReactNode;className?:string;onClick?:()=>void}){
 const {preview}=useBookingStore();return <Link href={previewHref(href,preview)} className={className} onClick={onClick}>{children}</Link>;
}
export function PageHeading({title,subtitle,action}:{title:string;subtitle?:string;action?:ReactNode}){
 return <div className="mb-6 flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><h1 className="text-[25px] leading-tight font-extrabold tracking-tight text-[#182d48] md:text-[27px]">{title}</h1>{subtitle&&<p className="mt-1.5 text-[12px] leading-5 text-slate-500">{subtitle}</p>}</div>{action}</div>;
}
export function Panel({title,subtitle,children,action,className=''}:{title?:string;subtitle?:string;children:ReactNode;action?:ReactNode;className?:string}){
 return <section className={`rounded-[18px] border border-octal-border bg-white panel-shadow ${className}`}>
 {title&&<div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"><div><h2 className="text-[13px] font-bold">{title}</h2>{subtitle&&<p className="mt-1 text-[11px] text-slate-400">{subtitle}</p>}</div>{action}</div>}{children}
 </section>;
}
export function IconTile({icon:Icon,tone='blue',size='md'}:{icon:LucideIcon;tone?:'blue'|'green'|'red'|'amber'|'violet';size?:'md'|'lg'}){
 const colors={blue:'bg-blue-50 text-blue-600',green:'bg-emerald-50 text-emerald-600',red:'bg-red-50 text-red-600',amber:'bg-amber-50 text-amber-600',violet:'bg-violet-50 text-violet-600'};
 return <span className={`inline-grid shrink-0 place-items-center rounded-xl ${colors[tone]} ${size==='lg'?'size-13':'size-10'}`}><Icon size={size==='lg'?23:19} strokeWidth={1.9}/></span>;
}
export function StatusBadge({value}:{value:string}){
 const x=value.toLowerCase();const tone=/confirm|qualified|paid|active|connected|complete/.test(x)?'bg-emerald-50 text-emerald-700':/cancel|declin|fail/.test(x)?'bg-rose-50 text-rose-700':/await|review|pending|new/.test(x)?'bg-amber-50 text-amber-700':'bg-slate-100 text-slate-600';
 return <span className={`inline-flex max-w-full items-center gap-1 truncate rounded-lg px-2.5 py-1.5 text-[10px] font-bold ${tone}`}><span aria-hidden className="size-1.5 rounded-full bg-current"/>{value}</span>;
}
export function PrimaryButton({children,onClick,type='button',disabled=false}:{children:ReactNode;onClick?:()=>void;type?:'button'|'submit';disabled?:boolean}){
 return <button type={type} disabled={disabled} onClick={onClick} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-octal-blue px-4 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-octal-hover disabled:opacity-45">{children}</button>;
}
export function SecondaryButton({children,onClick}:{children:ReactNode;onClick?:()=>void}){
 return <button type="button" onClick={onClick} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-700 hover:bg-slate-50">{children}</button>;
}
export function TextInput({value,onChange,placeholder,label,type='text',required=false}:{value:string;onChange:(s:string)=>void;placeholder?:string;label?:string;type?:string;required?:boolean}){
 return <label className="block min-w-0 flex-1"><span className="mb-1.5 block text-[11px] font-semibold text-slate-600">{label}</span><input type={type} required={required} placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)} className="min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[12px] outline-octal-blue placeholder:text-slate-400"/></label>;
}
export function SelectInput({label,value,onChange,items}:{label:string;value:string;onChange:(s:string)=>void;items:readonly string[]}){
 return <label className="block min-w-0 flex-1"><span className="mb-1.5 block text-[11px] font-semibold text-slate-600">{label}</span><select value={value} onChange={e=>onChange(e.target.value)} className="min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[12px]">{items.map(s=><option key={s}>{s}</option>)}</select></label>;
}
export function EmptyState({title='Nothing here yet',description='Records will appear after your workspace is connected.'}:{title?:string;description?:string}){
 return <div className="mx-auto grid min-h-40 max-w-sm content-center justify-items-center gap-2 px-4 py-8 text-center"><Info className="text-blue-400" size={25}/><p className="text-[13px] font-bold">{title}</p><p className="text-[11px] leading-5 text-slate-500">{description}</p></div>;
}
export function SearchField({value,onChange,placeholder='Search records'}:{value:string;onChange:(s:string)=>void;placeholder?:string}){
 return <label className="relative flex max-w-sm flex-1 items-center"><Search size={16} className="pointer-events-none absolute left-3 text-slate-400"/><input aria-label={placeholder} placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-10 text-[12px] outline-octal-blue"/></label>;
}
export interface MenuAction{label:string;icon:LucideIcon;href?:string;onClick?:()=>void;danger?:boolean;disabled?:boolean;}
export function ActionMenu({actions,label='Record options'}:{actions:MenuAction[];label?:string}){
 const [open,setOpen]=useState(false);const trigger=useRef<HTMLButtonElement>(null);const inner=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(!open)return;const previous=document.activeElement as HTMLElement|null;const triggerButton=trigger.current;const timer=requestAnimationFrame(()=>inner.current?.querySelector<HTMLElement>('button,a')?.focus());const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();setOpen(false)}if(e.key==='Tab'){const el=Array.from(inner.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href]')??[]);if(el.length){const first=el[0],last=el[el.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}}};document.addEventListener('keydown',key);return()=>{cancelAnimationFrame(timer);document.removeEventListener('keydown',key);(triggerButton??previous)?.focus()}},[open]);
 return <><button ref={trigger} aria-label={label} aria-haspopup="dialog" aria-expanded={open} onClick={e=>{e.stopPropagation();setOpen(true)}} className="inline-grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><EllipsisVertical size={19}/></button>{open&&<div className="modal-mobile-sheet fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}}><section ref={inner} role="dialog" aria-modal="true" aria-label={label} className="w-full max-w-[370px] rounded-[22px] bg-white p-4 shadow-2xl"><div className="mb-4 flex items-center justify-between"><h2 className="text-[15px] font-bold">{label}</h2><button className="rounded-lg p-2 hover:bg-slate-100" aria-label="Close options" onClick={()=>setOpen(false)}><X size={19}/></button></div><div className="space-y-2">{actions.map(a=>{const Icon=a.icon;const cls=`flex min-h-12 w-full items-center gap-3 rounded-xl bg-slate-50 px-3 py-3 text-left text-[12px] font-semibold hover:bg-blue-50 ${a.danger?'text-rose-600':'text-slate-700'} disabled:opacity-50`;return a.href?<AppLink key={a.label} href={a.href} className={cls} onClick={()=>setOpen(false)}><Icon size={18}/>{a.label}<ChevronRight size={15} className="ml-auto"/></AppLink>:<button key={a.label} type="button" className={cls} disabled={a.disabled} onClick={()=>{setOpen(false);a.onClick?.()}}><Icon size={18}/>{a.label}<ChevronRight size={15} className="ml-auto"/></button>})}</div><button onClick={()=>setOpen(false)} className="mt-4 w-full rounded-xl border border-blue-400 py-3 text-[12px] font-bold text-octal-blue md:hidden">Cancel</button></section></div>}</>;
}
export function DetailBack({href,label}:{href:string;label:string}){return <AppLink href={href} className="mb-4 inline-flex items-center gap-2 text-[12px] font-bold text-octal-blue hover:underline"><ArrowLeft size={16}/>{label}</AppLink>}
export function InSessionNote(){const {preview}=useBookingStore();return <p role="note" className="mt-3 rounded-xl bg-blue-50 p-3 text-[11px] leading-5 text-blue-800">{preview?'Example records: changes remain in this browser session. No customer is notified or charged.':'Connect a secure workspace before entering real client information. Booking and payment operations are unavailable.'}</p>}
