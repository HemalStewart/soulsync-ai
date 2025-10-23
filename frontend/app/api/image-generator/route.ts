import { Buffer } from 'node:buffer';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Venice image bridge.
 *
 * Why so much plumbing?
 * - Venice sometimes returns raw base64, other times a hosted URL, and may
 *   sprinkle in metadata like `{ image: '...' }`.
 * - We standardise the payload so the frontend always gets an `imageUrl`
 *   that works (data URL for base64, untouched if it's already a URL) and
 *   expose the stripped base64 separately for download/conversion flows.
 * - Quality, model, aspect ratio, etc. are sanitised to keep the API happy.
 */

const DEFAULT_API_BASE = 'https://api.venice.ai/api/v1';
const VENICE_API_KEY =
  process.env.VENICE_API_KEY ||
  process.env.VENICE_TOKEN ||
  process.env.VENICE_API_TOKEN ||
  process.env.VENICE_APIKEY ||
  '';
const VENICE_IMAGE_ENDPOINT =
  process.env.VENICE_IMAGE_ENDPOINT ||
  `${DEFAULT_API_BASE.replace(/\/$/, '')}/image/generate`;
const VENICE_IMAGE_MODEL =
  process.env.VENICE_IMAGE_MODEL || 'hidream';

type AspectRatio = '1:1' | '9:16' | '16:9' | '3:4' | '4:3';
type ImageFormat = 'webp' | 'png' | 'jpeg';

const ASPECT_DIMENSIONS: Record<AspectRatio, { width: number; height: number }> =
  {
    '1:1': { width: 1024, height: 1024 },
    '9:16': { width: 768, height: 1280 },
    '16:9': { width: 1280, height: 720 },
    '3:4': { width: 960, height: 1280 },
    '4:3': { width: 1280, height: 960 },
  };

const QUALITY_SETTINGS = [
  { cfgScale: 6.5, steps: 18 },
  { cfgScale: 7, steps: 22 },
  { cfgScale: 7.5, steps: 26 },
  { cfgScale: 8, steps: 32 },
  { cfgScale: 8.5, steps: 38 },
];

const STYLE_PRESET_MAP: Record<string, string> = {
  analog: 'Analog Film',
  anime: 'Anime',
  cinematic: 'Cinematic',
  comic: 'Comic Book',
  model3d: '3D Model',
  realistic: 'Analog Film',
  fantasy: 'Comic Book',
  '3d_model': '3D Model',
};

const ALLOWED_FORMATS: ImageFormat[] = ['webp', 'png', 'jpeg'];

const sanitizeString = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const sanitizeAspectRatio = (value: unknown): AspectRatio => {
  const candidate = sanitizeString(value);
  if (candidate && candidate in ASPECT_DIMENSIONS) {
    return candidate as AspectRatio;
  }

  switch (candidate) {
    case '2:3':
      return '3:4';
    case '3:2':
      return '4:3';
    default:
      return '1:1';
  }
};

const sanitizeFormat = (value: unknown): ImageFormat => {
  const candidate = sanitizeString(value)
    .toLowerCase()
    .replace(/^image\//, '');

  if (ALLOWED_FORMATS.includes(candidate as ImageFormat)) {
    return candidate as ImageFormat;
  }

  if (candidate === 'jpg' || candidate === 'jpe') {
    return 'jpeg';
  }

  const fallback =
    sanitizeString(process.env.VENICE_IMAGE_FORMAT)
      .toLowerCase()
      .replace(/^image\//, '') || 'webp';

  if (ALLOWED_FORMATS.includes(fallback as ImageFormat)) {
    return fallback as ImageFormat;
  }

  return 'webp';
};

const clampQuality = (value: unknown): number => {
  const parsed =
    typeof value === 'number'
      ? value
      : Number.parseInt(String(value), 10);

  if (Number.isNaN(parsed)) {
    return 3;
  }

  return Math.min(Math.max(parsed, 1), 5);
};

const buildError = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

const stripBase64Whitespace = (value: string): string =>
  value.replace(/\s+/g, '');

const isProbablyBase64 = (value: string): boolean => {
  if (!value) {
    return false;
  }

  const normalized = stripBase64Whitespace(value);
  if (normalized.length < 16) {
    return false;
  }

  if (/[^A-Za-z0-9+/=]/.test(normalized)) {
    return false;
  }

  try {
    const buffer = Buffer.from(normalized, 'base64');
    return buffer.length > 0;
  } catch {
    return false;
  }
};

const inferFormatFromUrl = (url: string): ImageFormat | null => {
  const match = url
    .split(/[?#]/, 1)[0]
    ?.toLowerCase()
    ?.match(/\.([a-z0-9]+)$/);

  if (!match) {
    return null;
  }

  switch (match[1]) {
    case 'webp':
      return 'webp';
    case 'png':
      return 'png';
    case 'jpg':
    case 'jpeg':
    case 'jpe':
      return 'jpeg';
    default:
      return null;
  }
};

const normalizeFormat = (value: unknown): ImageFormat | null => {
  const candidate = sanitizeString(value)
    .toLowerCase()
    .replace(/^image\//, '');

  if (ALLOWED_FORMATS.includes(candidate as ImageFormat)) {
    return candidate as ImageFormat;
  }

  if (candidate === 'jpg' || candidate === 'jpe') {
    return 'jpeg';
  }

  return null;
};

const DATA_URL_REGEX =
  /^data:image\/([a-z0-9+.-]+);base64,(.+)$/i;

type VeniceImageResult =
  | {
      kind: 'base64';
      base64: string;
      formatHint?: string;
    }
  | {
      kind: 'url';
      url: string;
      formatHint?: string;
    };

const parseDataUrl = (value: string): VeniceImageResult | null => {
  const match = value.match(DATA_URL_REGEX);
  if (!match) {
    return null;
  }

  const [, mimePart, base64Part] = match;
  return {
    kind: 'base64',
    base64: stripBase64Whitespace(base64Part),
    formatHint: mimePart,
  };
};

/**
 * Venice responses are fairly loose: `images` can be an array of strings,
 * objects, base64 chunks, or hosted URLs. We walk the array and return the
 * first usable payload, carrying through any format hints so the caller can
 * label the file correctly.
 */
const extractFirstImage = (images: unknown[]): VeniceImageResult | null => {
  for (const item of images) {
    if (typeof item === 'string' && item.trim()) {
      const trimmed = item.trim();
      if (trimmed.startsWith('data:image/')) {
        const parsed = parseDataUrl(trimmed);
        if (parsed) {
          return parsed;
        }
        continue;
      }

      if (/^https?:\/\//i.test(trimmed)) {
        return { kind: 'url', url: trimmed };
      }

      if (isProbablyBase64(trimmed)) {
        return {
          kind: 'base64',
          base64: stripBase64Whitespace(trimmed),
        };
      }
    }

    if (item && typeof item === 'object') {
      const record = item as Record<string, unknown>;
      const formatHint = sanitizeString(
        record.format ?? record.mime_type ?? record.mimeType
      );
      const candidate =
        record.data_url ??
        record.dataUrl ??
        record.imageUrl ??
        record.image_url ??
        record.url ??
        record.href ??
        record.remote_url ??
        record.src ??
        record.base64 ??
        record.base64_data ??
        record.b64_json ??
        record.binary ??
        record.data ??
        record.content ??
        null;

      if (typeof candidate === 'string' && candidate.trim()) {
        const trimmed = candidate.trim();

        if (trimmed.startsWith('data:image/')) {
          const parsed = parseDataUrl(trimmed);
          if (parsed) {
            return {
              ...parsed,
              formatHint: parsed.formatHint ?? formatHint,
            };
          }
          continue;
        }

        if (/^https?:\/\//i.test(trimmed)) {
          return {
            kind: 'url',
            url: trimmed,
            formatHint: formatHint || undefined,
          };
        }

        if (isProbablyBase64(trimmed)) {
          return {
            kind: 'base64',
            base64: stripBase64Whitespace(trimmed),
            formatHint: formatHint || undefined,
          };
        }
      }
    }
  }

  return null;
};

const buildDataUrl = (image: string, format: ImageFormat): string =>
  `data:image/${format};base64,${stripBase64Whitespace(image)}`;

export async function POST(request: NextRequest) {
  if (!VENICE_API_KEY) {
    return buildError('VENICE_API_KEY is not configured.', 500);
  }

  let payload: Record<string, unknown>;

  try {
    payload = await request.json();
  } catch {
    return buildError('Invalid JSON payload.');
  }

  const prompt = sanitizeString(payload.prompt);
  if (!prompt) {
    return buildError('prompt is required.');
  }

  const aspectRatio = sanitizeAspectRatio(payload.aspect_ratio);
  const { width, height } = ASPECT_DIMENSIONS[aspectRatio];
  const negativePrompt = sanitizeString(payload.negative_prompt);
  const style = sanitizeString(payload.style);
  const format = sanitizeFormat(payload.output_format);
  const quality = clampQuality(payload.quality);
  const qualityPreset =
    QUALITY_SETTINGS[quality - 1] ?? QUALITY_SETTINGS[2];
  const seed = sanitizeString(payload.seed);
  const cfgScale = payload.cfg_scale ?? undefined;
  const stepsOverride = payload.steps ?? undefined;

  const venicePayload: Record<string, unknown> = {
    model: sanitizeString(payload.model) || VENICE_IMAGE_MODEL,
    prompt,
    width,
    height,
    format,
    cfg_scale:
      typeof cfgScale === 'number'
        ? cfgScale
        : qualityPreset.cfgScale,
    steps:
      typeof stepsOverride === 'number'
        ? stepsOverride
        : qualityPreset.steps,
    return_binary: false,
    variants: 1,
    hide_watermark: true,
    safe_mode: payload.safe_mode === true,
    embed_exif_metadata: false,


    
    pg_rating: 'pg-13', // Uncomment to nudge Venice to stay within PG-13 content
    content_filter: 'strict', // Uncomment to enable Venice content filtering
    disable_uncensored_content: true, // Uncomment to force Venice safe-mode behaviour
  };

  if (negativePrompt) {
    venicePayload.negative_prompt = negativePrompt;
  }

  if (style) {
    const preset = STYLE_PRESET_MAP[style.toLowerCase()];
    if (preset) {
      venicePayload.style_preset = preset;
    }
  }

  if (seed) {
    const numericSeed = Number.parseInt(seed, 10);
    if (!Number.isNaN(numericSeed)) {
      venicePayload.seed = numericSeed;
    }
  }

  try {
    const response = await fetch(VENICE_IMAGE_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${VENICE_API_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(venicePayload),
      cache: 'no-store',
    });

    const payloadJson = (await response.json().catch(() => null)) as
      | {
          id?: unknown;
          images?: unknown;
          error?: unknown;
          message?: unknown;
        }
      | null;

    if (!response.ok) {
      // Normalise Venice errors so we can surface on-brand messaging.
      const veniceDetailRaw =
        sanitizeString(payloadJson?.error) ||
        sanitizeString(payloadJson?.message);

      let detail = veniceDetailRaw;
      const status = response.status;

      if (status === 400 || status === 403) {
        const normalized = veniceDetailRaw.toLowerCase();
        const looksLikeContentBlock =
          normalized === '' ||
          /safety|policy|content\s*filter|uncensored|explicit|nsfw|nudity/.test(
            normalized
          );

        if (looksLikeContentBlock) {
          // Friendly copy when Venice blocks explicit or unsafe content.
          detail =
            'We could not generate that image because the prompt may violate our community guidelines. Try adjusting the description to keep it friendly.';
        }
      }

      if (!detail) {
        detail = `Venice request failed with status ${response.status}`;
      }

      return buildError(detail, status);
    }

    const images = Array.isArray(payloadJson?.images)
      ? payloadJson.images
      : [];
    const imageResult = extractFirstImage(images);

    if (!imageResult) {
      return buildError(
        'Venice response did not include an image.',
        502
      );
    }

    let resolvedFormat = format;
    let imageUrl: string;
    let imageBase64: string | null = null;

    const hintedFormat = normalizeFormat(imageResult.formatHint);
    if (hintedFormat) {
      resolvedFormat = hintedFormat;
    }

    if (imageResult.kind === 'base64') {
      imageBase64 = stripBase64Whitespace(imageResult.base64);
      imageUrl = buildDataUrl(imageBase64, resolvedFormat);
    } else {
      const inferred = inferFormatFromUrl(imageResult.url);
      if (inferred) {
        resolvedFormat = inferred;
      }
      imageUrl = imageResult.url;
    }

    return NextResponse.json({
      data: {
        image: imageBase64,
        imageUrl,
        format: resolvedFormat,
        requestId:
          typeof payloadJson?.id === 'string'
            ? payloadJson.id
            : null,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to reach Venice API.';
    return buildError(message, 500);
  }
}

export async function GET() {
  return buildError('Use POST to generate images.', 405);
}
