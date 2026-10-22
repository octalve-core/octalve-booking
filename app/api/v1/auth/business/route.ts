import {accountMutation} from '@/src/server/identity/account-http';
import type {NextRequest} from 'next/server';
export const runtime='nodejs';
export function PATCH(request:NextRequest){return accountMutation(request,'business')}
