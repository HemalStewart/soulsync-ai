import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const REPLICATE_MODEL_BASE =
  'https://api.replicate.com/v1/models/minimax/video-01';
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 600_000;

type ReplicatePrediction = {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  error?: string | null;
  output?: unknown;
  urls?: {
    get?: string;
  };
};

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const sanitizeString = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const buildErrorResponse = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

const extractVideoUrl = (output: unknown): string | null => {
  if (!output) {
    return null;
  }

  if (typeof output === 'string') {
    return output;
  }

  if (Array.isArray(output)) {
    for (const item of output) {
      const candidate = extractVideoUrl(item);
      if (candidate) {
        return candidate;
      }
    }
  }

  if (typeof output === 'object') {
    const record = output as Record<string, unknown>;
    if (typeof record.url === 'string') {
      return record.url;
    }

    if (typeof record.video === 'string') {
      return record.video;
    }

    if (Array.isArray(record.results)) {
      return extractVideoUrl(record.results);
    }
  }

  return null;
};

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
  const firstFrameImage = sanitizeString(
    payload.first_frame_image ?? payload.firstFrameImage,
  );
  const subjectReference = sanitizeString(
    payload.subject_reference ?? payload.subjectReference,
  );
  const promptOptimizerRaw =
    payload.prompt_optimizer ?? payload.promptOptimizer;
  const promptOptimizer =
    typeof promptOptimizerRaw === 'boolean'
      ? promptOptimizerRaw
      : promptOptimizerRaw === 'false'
        ? false
        : true;

  if (!prompt) {
    return buildErrorResponse('prompt is required.');
  }

  const replicateInput: Record<string, unknown> = {
    prompt,
    prompt_optimizer: promptOptimizer,
  };

  if (firstFrameImage) {
    replicateInput.first_frame_image = firstFrameImage;
  }

  if (subjectReference) {
    replicateInput.subject_reference = subjectReference;
  }

  try {
    const createResponse = await fetch(`${REPLICATE_MODEL_BASE}/predictions`, {
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
          'Video generation timed out before completion.',
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

    const videoUrl = extractVideoUrl(currentPrediction.output);

    if (!videoUrl) {
      return buildErrorResponse(
        'Prediction completed but no video URL was returned.',
        502,
      );
    }

    return NextResponse.json({
      data: {
        videoUrl,
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
  return buildErrorResponse('Use POST to generate videos.', 405);
}
