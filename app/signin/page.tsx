import {AuthPage} from '@/components/auth/AuthPage';
import {Suspense} from 'react';
export const metadata={title:'Sign in | Octalve Booking'};
export default function Page(){return <Suspense fallback={<main className="min-h-svh bg-[#f5f9ff]"/></Suspense>} ><AuthPage mode="signin"/>}
