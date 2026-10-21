import {authenticatedOperation} from '@/src/server/identity/http';
import type {NextRequest} from 'next/server';
export const runtime='nodejs';
export function POST(request:NextRequest){return authenticatedOperation(request,'forgot-password')}
