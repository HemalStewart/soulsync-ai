import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const RAPIDAPI_KEY = process.env.RAPIDAPI_IMAGE_KEY;
const RAPIDAPI_HOST =
  process.env.RAPIDAPI_IMAGE_HOST || 'porn-image1.p.rapidapi.com';

const buildRemoteUrl = (type: string) =>
  `https://${RAPIDAPI_HOST}/?type=${encodeURIComponent(type)}`;

export async function GET(request: NextRequest) {
  if (!RAPIDAPI_KEY) {
    return NextResponse.json(
      { error: 'RAPIDAPI_IMAGE_KEY is not configured.' },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'view';

  try {
    const response = await fetch(buildRemoteUrl(type), {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const message = `Remote service responded with status ${response.status}`;
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json({ data });
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const imageUrl = `data:${contentType};base64,${base64}`;
    return NextResponse.json({ data: { imageUrl } });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to reach image API.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
