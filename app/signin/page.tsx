import {Suspense} from 'react';
import {AuthPage} from '@/components/auth/AuthPage';
export const metadata={title:'Sign in | Octalve Booking'};
export default function Page(){return <Suspense fallback={<main className="min-h-svh bg-[#f5f9ff]"/>}><AuthPage mode="signin"/></Suspense>}
