'use client';
import {createContext,useContext,useState,type ReactNode} from 'react';
import {exampleRecords,emptyRecords} from './fixtures';
import type {AppRecordState,Booking,Enquiry,Client,Service,WeeklyHours,AvailabilitySettings} from './types';
interface Store {
 preview:boolean; data:AppRecordState;
 saveBooking:(record:Booking)=>void; saveClient:(record:Client)=>void;
 saveEnquiry:(record:Enquiry)=>void; saveService:(record:Service)=>void;
 updateHours:(hours:WeeklyHours)=>void; updateAvailability:(settings:AvailabilitySettings)=>void;
}
const Context=createContext<Store|null>(null);
function replaceById<T extends {id:string}>(previous:T[],next:T):T[]{return previous.some(x=>x.id===next.id)?previous.map(x=>x.id===next.id?next:x):[next,...previous]}
export function BookingStore({preview,children}:{preview:boolean;children:ReactNode}){
 const [data,setData]=useState<AppRecordState>(()=>preview?structuredClone(exampleRecords):emptyRecords());
 const update=<T extends Booking|Client|Enquiry|Service>(key:'bookings'|'clients'|'enquiries'|'services',record:T)=>{
   if(!preview)return;
   setData(old=>({...old,[key]:replaceById(old[key] as T[],record)}));
 };
 return <Context.Provider value={{preview,data,saveBooking:x=>update('bookings',x),saveClient:x=>update('clients',x),saveEnquiry:x=>update('enquiries',x),saveService:x=>update('services',x),updateHours:hours=>{if(preview)setData(o=>({...o,hours}))},updateAvailability:availability=>{if(preview)setData(o=>({...o,availability}))}}}>{children}</Context.Provider>;
}
export function useBookingStore():Store{const context=useContext(Context);if(!context)throw new Error('BookingStore required');return context}
