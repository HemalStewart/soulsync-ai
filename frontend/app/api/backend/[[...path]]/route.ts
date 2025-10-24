import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_BASE_URL =
  process.env.BACKEND_API_BASE_URL ??
  'http://localhost:8888/chatsoul-ai/backend/public/api';

const buildBackendUrl = (segments: string[], searchParams: URLSearchParams) => {
  const path = segments.join('/');
  const query = searchParams.toString();
  const url = `${BACKEND_API_BASE_URL.replace(/\/$/, '')}/${path}${
    query ? `?${query}` : ''
  }`;
  return url;
};

const forwardRequest = async (
  request: NextRequest,
  method: string,
  segments: string[]
) => {
  const url = buildBackendUrl(segments, request.nextUrl.searchParams);
  const headers = new Headers();
  const cookie = request.headers.get('cookie');
  if (cookie) {
    headers.set('cookie', cookie);
  }
  const contentType = request.headers.get('content-type');
  if (contentType) {
    headers.set('content-type', contentType);
  }

  const init: RequestInit = {
    method,
    headers,
    cache: 'no-store',
  };

  if (!['GET', 'HEAD'].includes(method)) {
    init.body = await request.text();
  }

  let backendResponse: Response;
  try {
    backendResponse = await fetch(url, init);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : 'Backend request failed.',
      },
      { status: 502 }
    );
  }

  const responseHeaders = new Headers();
  const backendContentType = backendResponse.headers.get('content-type');
  if (backendContentType) {
    responseHeaders.set('content-type', backendContentType);
  }

  // forward cookies if present
  const setCookie = backendResponse.headers.get('set-cookie');
  if (setCookie) {
    responseHeaders.set('set-cookie', setCookie);
  }

  const text = await backendResponse.text();
  return new NextResponse(text, {
    status: backendResponse.status,
    headers: responseHeaders,
  });
};

type RouteContext = { params: Promise<{ path?: string[] }> };

const resolveSegments = async (context: RouteContext) => {
  const { path = [] } = await context.params;
  return path;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const segments = await resolveSegments(context);
  return forwardRequest(request, 'GET', segments);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const segments = await resolveSegments(context);
  return forwardRequest(request, 'POST', segments);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const segments = await resolveSegments(context);
  return forwardRequest(request, 'PUT', segments);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const segments = await resolveSegments(context);
  return forwardRequest(request, 'DELETE', segments);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const segments = await resolveSegments(context);
  return forwardRequest(request, 'PATCH', segments);
}

export function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

