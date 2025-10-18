import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const REPLICATE_BASE_URL =
  'https://api.replicate.com/v1/models/google/imagen-4';
const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 60_000;
const DEFAULT_ASPECT_RATIO = '1:1';
const DEFAULT_SAFETY_FILTER = 'block_medium_and_above';
const DEFAULT_OUTPUT_FORMAT = 'jpg';
const ALLOWED_ASPECT_RATIOS = new Set(['1:1', '9:16', '16:9', '3:4', '4:3']);

type ReplicatePrediction = {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  error?: string | null;
  output?: unknown;
};

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const extractImageUrl = (output: unknown): string | null => {
  if (!output) {
    return null;
  }

  if (typeof output === 'string') {
    return output;
  }

  if (Array.isArray(output)) {
    for (const item of output) {
      const candidate = extractImageUrl(item);
      if (candidate) {
        return candidate;
      }
    }
    return null;
  }

  if (typeof output === 'object') {
    const record = output as Record<string, unknown>;
    if (typeof record.url === 'string') {
      return record.url;
    }

    if (typeof record.image === 'string') {
      return record.image;
    }

    if (record.output) {
      return extractImageUrl(record.output);
    }
  }

  return null;
};

const sanitizeAspectRatio = (value: unknown): string => {
  if (typeof value !== 'string') {
    return DEFAULT_ASPECT_RATIO;
  }

  const trimmed = value.trim();

  if (ALLOWED_ASPECT_RATIOS.has(trimmed)) {
    return trimmed;
  }

  // Backwards compatibility with legacy aspect ratios.
  switch (trimmed) {
    case '2:3':
      return '3:4';
    case '3:2':
      return '4:3';
    default:
      return DEFAULT_ASPECT_RATIO;
  }
};

const sanitizeString = (value: unknown): string => {
  return typeof value === 'string' ? value.trim() : '';
};

const buildErrorResponse = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

export async function POST(request: NextRequest) {
  if (!REPLICATE_API_TOKEN) {
    return buildErrorResponse('REPLICATE_API_TOKEN is not configured.', 500);
  }

  let payload: Record<string, unknown>;

  try {
    payload = await request.json();
  } catch {
    return buildErrorResponse('Invalid JSON payload.');
  }

  const prompt = sanitizeString(payload.prompt);
  const aspectRatio = sanitizeAspectRatio(payload.aspect_ratio);
  const negativePrompt = sanitizeString(payload.negative_prompt);
  const safetyFilter =
    sanitizeString(payload.safety_filter_level) || DEFAULT_SAFETY_FILTER;
  const outputFormat =
    sanitizeString(payload.output_format) || DEFAULT_OUTPUT_FORMAT;

  if (!prompt) {
    return buildErrorResponse('prompt is required.');
  }

  const replicateInput: Record<string, unknown> = {
    prompt,
    aspect_ratio: aspectRatio,
    output_format: outputFormat,
    safety_filter_level: safetyFilter,
  };

  if (negativePrompt) {
    replicateInput.negative_prompt = negativePrompt;
  }

  try {
    const createResponse = await fetch(`${REPLICATE_BASE_URL}/predictions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ input: replicateInput }),
      cache: 'no-store',
    });

    const initialPrediction =
      (await createResponse.json()) as ReplicatePrediction & {
        detail?: string;
      };

    if (!createResponse.ok) {
      const detail =
        sanitizeString(initialPrediction?.error) ||
        sanitizeString(initialPrediction?.detail) ||
        `Replicate request failed with status ${createResponse.status}`;
      return buildErrorResponse(detail, createResponse.status);
    }

    let currentPrediction: ReplicatePrediction = initialPrediction;
    const start = Date.now();

    while (
      currentPrediction.status !== 'succeeded' &&
      currentPrediction.status !== 'failed' &&
      currentPrediction.status !== 'canceled'
    ) {
      if (Date.now() - start > POLL_TIMEOUT_MS) {
        return buildErrorResponse(
          'Image generation timed out before completion.',
          504,
        );
      }

      await wait(POLL_INTERVAL_MS);

      const pollResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${currentPrediction.id}`,
        {
          headers: {
            Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
            Accept: 'application/json',
          },
          cache: 'no-store',
        },
      );

      if (!pollResponse.ok) {
        const detail = await pollResponse
          .json()
          .then((json) => sanitizeString(json?.error) || sanitizeString(json?.detail))
          .catch(() => '');
        return buildErrorResponse(
          detail || `Failed to poll prediction ${currentPrediction.id}.`,
          pollResponse.status,
        );
      }

      currentPrediction = (await pollResponse.json()) as ReplicatePrediction;
    }

    if (currentPrediction.status !== 'succeeded') {
      const detail =
        sanitizeString(currentPrediction.error) ||
        `Prediction ended with status ${currentPrediction.status}.`;
      return buildErrorResponse(detail, 502);
    }

    const imageUrl = extractImageUrl(currentPrediction.output);

    if (!imageUrl) {
      return buildErrorResponse(
        'Prediction completed but no image URL was returned.',
        502,
      );
    }

    return NextResponse.json({
      data: {
        imageUrl,
        predictionId: currentPrediction.id,
        status: currentPrediction.status,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to reach Replicate API.';
    return buildErrorResponse(message, 500);
  }
}

export async function GET() {
  return buildErrorResponse('Use POST to generate images.', 405);
}
