import {sessionStatus} from '@/src/server/identity/http';
import type {NextRequest} from 'next/server';
export const runtime='nodejs';
export function GET(request:NextRequest){return sessionStatus(request)}
