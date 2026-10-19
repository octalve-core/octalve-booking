import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={title:'Octalve Booking | Appointments, organised',description:'Business and personal booking platform for services, availability, enquiries and appointments.',icons:{icon:'/brand/favicon.svg'},robots:{index:false,follow:false}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
