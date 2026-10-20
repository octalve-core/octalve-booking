import {Suspense} from 'react';
import {WorkspaceShell} from '@/components/layout/WorkspaceShell';
export default function WorkspaceLayout({children}:{children:React.ReactNode}){
 return <Suspense fallback={<div className="grid min-h-svh place-items-center text-slate-500">Opening Octalve Booking…</div>}><WorkspaceShell>{children}</WorkspaceShell></Suspense>;
}
