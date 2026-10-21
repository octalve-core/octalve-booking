import {AuthPage} from '@/components/auth/AuthPage';
import {Suspense} from 'react';
export const metadata={title:'Create account | Octalve Booking'};
export default function Page(){return <Suspense fallback={<main className="min-h-svh bg-[#f5f9ff]"/></Suspense>} ><AuthPage mode="signup"/>}
