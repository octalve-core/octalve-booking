import {Suspense} from "react";
import {PublicBooking} from "@/components/booking/PublicBooking";
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return <Suspense fallback={<p className="p-8">Opening booking page…</p>}><PublicBooking slug={slug}/></Suspense>}
