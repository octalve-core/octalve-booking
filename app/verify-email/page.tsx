import {Suspense} from 'react';
import {TokenAction} from '@/components/auth/TokenAction';
export const metadata={title:'Verify email | Octalve Booking',referrer:'no-referrer'};
export default function Page(){return <Suspense fallback={<main className="min-h-svh bg-[#f5f9ff]"/>}><TokenAction purpose="verify"/></Suspense>}
