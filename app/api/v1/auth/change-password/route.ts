import {accountMutation} from '@/src/server/identity/account-http';
import type {NextRequest} from 'next/server';
export const runtime='nodejs';
export function POST(request:NextRequest){return accountMutation(request,'password')}
