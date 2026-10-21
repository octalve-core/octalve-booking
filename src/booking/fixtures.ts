import type {AppRecordState} from './types';
/** Fictional UI fixtures; never a source of payment, booking or provider authority. */
export const exampleRecords:AppRecordState={
 clients:[
  {id:'CL-0001',name:'Amara Okafor',email:'amara@example.invalid',phone:'+234 800 000 0001',notes:'Interested in a longer advisory engagement.',stage:'Active'},
  {id:'CL-0002',name:'Daniel Ade',email:'daniel@example.invalid',phone:'+234 800 000 0002',notes:'',stage:'Follow up'},
  {id:'CL-0003',name:'Femi Bello',email:'femi@example.invalid',phone:'+234 800 000 0003',notes:'',stage:'New'},
  {id:'CL-0004',name:'Zainab Lawal',email:'zainab@example.invalid',phone:'+234 800 000 0004',notes:'',stage:'New'},
 ],
 services:[
  {id:'SV-01',title:'Business strategy consultation',minutes:60,price:25000,deposit:10000,format:'Google Meet',description:'A focused discussion of business priorities and practical next steps.',active:true},
  {id:'SV-02',title:'Project scoping session',minutes:45,price:15000,deposit:0,format:'In person',description:'Clarify deliverables, scope, expectations and timelines.',active:true},
  {id:'SV-03',title:'Introductory discovery call',minutes:30,price:0,deposit:0,format:'Zoom',description:'Explore whether we are a good fit.',active:true},
 ],
 bookings:[
  {id:'BK-00084',clientId:'CL-0001',serviceId:'SV-01',date:'2026-10-20',time:'10:00',status:'Confirmed',method:'Gateway',note:'Discuss growth strategy for a retail business.'},
  {id:'BK-00085',clientId:'CL-0002',serviceId:'SV-02',date:'2026-10-20',time:'14:30',status:'Awaiting bank review',method:'Merchant bank',note:'Project requirements and quote.'},
  {id:'BK-00086',clientId:'CL-0003',serviceId:'SV-03',date:'2026-10-21',time:'11:30',status:'Confirmed',method:'Free',note:''},
  {id:'BK-00087',clientId:'CL-0004',serviceId:'SV-01',date:'2026-10-22',time:'09:00',status:'Awaiting payment',method:'Gateway',note:''}
 ],
 enquiries:[
  {id:'ENQ-0001',clientId:'CL-0001',subject:'Growth strategy advisory',brief:'I want to improve customer retention and online revenue.',status:'Reviewing',notes:''},
  {id:'ENQ-0002',clientId:'CL-0002',subject:'Website project scope',brief:'Planning a new services website and cost estimation.',status:'New',notes:''},
  {id:'ENQ-0003',clientId:'CL-0004',subject:'Market assessment',brief:'Need guidance on target market and implementation.',status:'Qualified',notes:''}
 ],
 availability:{timezone:'Africa/Lagos',bufferBefore:0,bufferAfter:15,minNoticeHours:24,maxAdvanceDays:60,overrides:[]},
 hours:{0:[],1:[{start:'09:00',end:'17:00'}],2:[{start:'09:00',end:'17:00'}],3:[{start:'09:00',end:'17:00'}],4:[{start:'09:00',end:'17:00'}],5:[{start:'09:00',end:'16:00'}],6:[]}
};
export function emptyRecords():AppRecordState {return {bookings:[],clients:[],enquiries:[],services:[],hours:structuredClone(exampleRecords.hours),availability:structuredClone(exampleRecords.availability)}};
