import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const REPLICATE_MODEL_BASE =
  'https://api.replicate.com/v1/models/minimax/video-01';

type ReplicatePrediction = {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  error?: string | null;
  output?: unknown;
  urls?: {
    get?: string;
  };
};

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

    if (
      initialPrediction.status === 'failed' ||
      initialPrediction.status === 'canceled'
    ) {
      const detail =
        sanitizeString(initialPrediction.error) ||
        `Prediction ended with status ${initialPrediction.status}.`;
      return buildErrorResponse(detail, 502);
    }

    if (initialPrediction.status === 'succeeded') {
      const videoUrl = extractVideoUrl(initialPrediction.output);

      if (!videoUrl) {
        return buildErrorResponse(
          'Prediction completed but no video URL was returned.',
          502,
        );
      }

      return NextResponse.json({
        data: {
          videoUrl,
          predictionId: initialPrediction.id,
          status: initialPrediction.status,
        },
      });
    }

    return NextResponse.json(
      {
        data: {
          predictionId: initialPrediction.id,
          status: initialPrediction.status,
          ...(initialPrediction.urls?.get
            ? { pollUrl: initialPrediction.urls.get }
            : {}),
        },
      },
      { status: 202 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to reach Replicate API.';
    return buildErrorResponse(message, 500);
  }
}

export async function GET(request: NextRequest) {
  if (!REPLICATE_API_TOKEN) {
    return buildErrorResponse('REPLICATE_API_TOKEN is not configured.', 500);
  }

  const url = new URL(request.url);
  const predictionId = sanitizeString(
    url.searchParams.get('predictionId') ?? url.searchParams.get('id'),
  );

  if (!predictionId) {
    return buildErrorResponse('predictionId is required.', 400);
  }

  try {
    const pollResponse = await fetch(
      `https://api.replicate.com/v1/predictions/${predictionId}`,
      {
        headers: {
          Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      },
    );

    const prediction = (await pollResponse.json()) as ReplicatePrediction & {
      detail?: string;
    };

    if (!pollResponse.ok) {
      const detail =
        sanitizeString(prediction?.error) ||
        sanitizeString(prediction?.detail) ||
        `Failed to poll prediction ${predictionId}.`;
      return buildErrorResponse(detail, pollResponse.status);
    }

    if (
      prediction.status === 'failed' ||
      prediction.status === 'canceled'
    ) {
      const detail =
        sanitizeString(prediction.error) ||
        `Prediction ended with status ${prediction.status}.`;
      return buildErrorResponse(detail, 502);
    }

    if (prediction.status === 'succeeded') {
      const videoUrl = extractVideoUrl(prediction.output);

      if (!videoUrl) {
        return buildErrorResponse(
          'Prediction succeeded but no video URL was returned.',
          502,
        );
      }

      return NextResponse.json({
        data: {
          predictionId: prediction.id,
          status: prediction.status,
          videoUrl,
        },
      });
    }

    return NextResponse.json({
      data: {
        predictionId: prediction.id,
        status: prediction.status,
        ...(prediction.urls?.get ? { pollUrl: prediction.urls.get } : {}),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to reach Replicate API.';
    return buildErrorResponse(message, 500);
  }
}
