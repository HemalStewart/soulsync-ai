import { NextResponse } from 'next/server';

const backendBase =
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL ??
  'http://localhost:8888/chatsoul-ai/backend/public';

export function GET() {
  const target = `${backendBase.replace(/\/$/, '')}/oauth/google`;
  return NextResponse.redirect(target);
}
