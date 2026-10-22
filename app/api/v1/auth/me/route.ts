import {accountRead,accountMutation} from '@/src/server/identity/account-http';
import type {NextRequest} from 'next/server';
export const runtime='nodejs';
export function GET(request:NextRequest){return accountRead(request)}
export function PATCH(request:NextRequest){return accountMutation(request,'profile')}
