import { NextResponse } from 'next/server';

const backendBase =
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL ??
  'http://localhost:8888/soulsync-full/backend/public';

export function GET() {
  const target = `${backendBase.replace(/\/$/, '')}/oauth/google`;
  return NextResponse.redirect(target);
}
