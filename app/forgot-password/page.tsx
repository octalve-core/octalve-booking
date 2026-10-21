import {Suspense} from 'react';
import {AuthPage} from '@/components/auth/AuthPage';
export const metadata={title:'Reset password | Octalve Booking'};
export default function Page(){return <Suspense fallback={<main className="min-h-svh bg-[#f5f9ff]"/>}><AuthPage mode="reset"/></Suspense>}
