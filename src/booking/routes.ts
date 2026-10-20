export const moduleRoutes=[
 {label:'Overview',href:'/',icon:'LayoutDashboard'},
 {label:'Bookings',href:'/bookings',icon:'CalendarCheck'},
 {label:'Calendar',href:'/calendar',icon:'CalendarDays'},
 {label:'Services',href:'/services',icon:'BriefcaseBusiness'},
 {label:'Enquiries',href:'/enquiries',icon:'ClipboardList'},
 {label:'Clients',href:'/clients',icon:'UsersRound'},
 {label:'Payments',href:'/payments',icon:'Wallet'},
 {label:'Integrations',href:'/integrations',icon:'PlugZap'},
 {label:'Reports',href:'/reports',icon:'ChartNoAxesCombined'},
 {label:'Get started',href:'/getting-started',icon:'ListChecks'},
 {label:'Settings',href:'/settings',icon:'Settings2'},
] as const;
export function previewHref(href:string,preview:boolean):string {return preview?(href.includes('?')?`${href}&preview=1`:`${href}?preview=1`):href;}
