import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
const exists=p=>existsSync(new URL(p,root));
const manifest=JSON.parse(read('package.json'));
test('core architecture is Next.js React TypeScript Tailwind',()=>{
 for(const s of ['next','react','react-dom','lucide-react'])assert.ok(manifest.dependencies[s],s);
 for(const s of ['tailwindcss','@tailwindcss/postcss','typescript'])assert.ok(manifest.devDependencies[s],s);
 assert.match(read('app/globals.css'),/@import "tailwindcss"/);
 assert.match(read('postcss.config.mjs'),/@tailwindcss\/postcss/);
 assert.equal(JSON.parse(read('tsconfig.json')).compilerOptions.strict,true);
});
test('workspace renders native JSX and never loads legacy imperative booking script',()=>{
 assert.ok(exists('app/(workspace)/page.tsx'));
 assert.match(read('components/layout/WorkspaceShell.tsx'),/BookingStore/);
 for(const p of ['app/layout.tsx','app/(workspace)/layout.tsx','components/layout/WorkspaceShell.tsx'])assert.doesNotMatch(read(p),/booking\.js|dangerouslySetInnerHTML|innerHTML/);
});
test('every important workspace is a dedicated Next.js route',()=>{
 for(const page of ['bookings','clients','enquiries','services','calendar','integrations','payments','reports','settings','account','getting-started','more'])assert.ok(exists(`app/(workspace)/${page}/page.tsx`),page);
 for(const page of ['bookings/[id]','bookings/[id]/edit','bookings/[id]/reschedule','clients/[id]','enquiries/[id]/edit','services/[id]','integrations/[slug]'])assert.ok(exists(`app/(workspace)/${page}/page.tsx`),page);
 assert.ok(exists('app/b/[slug]/page.tsx'));
});
test('Finance-inspired mobile navigation and accessible action sheets are native',()=>{
 const ui=read('components/ui/Primitives.tsx'),shell=read('components/layout/WorkspaceShell.tsx');
 assert.match(ui,/aria-modal="true"/);assert.match(ui,/e\.key==='Escape'/);assert.match(ui,/e\.key==='Tab'/);
 assert.match(ui,/modal-mobile-sheet/);assert.match(read('app/globals.css'),/max-width:767px/);
 assert.match(shell,/Mobile primary navigation/);assert.match(shell,/label:'More'/);
});
test('public flow is typed, payment cannot be fabricated and requests stay disabled',()=>{
 const flow=read('components/booking/PublicBooking.tsx');
 assert.match(flow,/disabled/);assert.match(flow,/Live availability must be verified/);
 assert.match(read('components/booking/WorkspaceViews.tsx'),/Set a price of ₦0/);assert.match(flow,/booking engine/);
 assert.ok(exists('app/api/v1/bookings/route.ts'));
});
test('no direct code dependencies on Finance or EMR',()=>{
 for(const p of ['components/booking/WorkspaceViews.tsx','components/booking/PublicBooking.tsx','src/booking/store.tsx','components/layout/WorkspaceShell.tsx']){
 const s=read(p);assert.doesNotMatch(s,/from\s*['"][^'"]*octalve-(?:invoice|finance|emr)/i);
 }
});
