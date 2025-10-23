import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const MEDIA_ROOT = path.join(process.cwd(), 'public');

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp']);
const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov', '.m4v']);

const sanitizeIdentifier = (value: string): string | null => {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return null;
  }

  return trimmed;
};

const listFiles = async (directory: string, allowedExtensions: Set<string>) => {
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });

    const files = entries
      .filter((entry) => entry.isFile())
      .filter((entry) => allowedExtensions.has(path.extname(entry.name).toLowerCase()))
      .map((entry) => {
        const basename = entry.name.replace(/\.[^.]+$/, '');
        const label = basename
          .replace(/[_-]+/g, ' ')
          .replace(/\s+/g, ' ')
          .replace(/\b\w/g, (char) => char.toUpperCase())
          .trim();

        return {
          filename: entry.name,
          label: label || entry.name,
        };
      });

    return files;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
};

export const GET = async (
  _request: NextRequest,
  { params }: { params: Promise<{ characterId: string }> }
) => {
  const resolvedParams = await params;
  const rawIdentifier = resolvedParams?.characterId;
  const characterId = rawIdentifier ? sanitizeIdentifier(rawIdentifier) : null;

  if (!characterId) {
    return NextResponse.json(
      { error: 'Invalid character identifier.' },
      { status: 400 }
    );
  }

  const characterDir = path.join(MEDIA_ROOT, characterId);
  const imagesDir = path.join(characterDir, 'images');
  const videosDir = path.join(characterDir, 'videos');

  try {
    const stats = await fs.stat(characterDir);
    if (!stats.isDirectory()) {
      return NextResponse.json(
        { error: 'Character media directory not found.' },
        { status: 404 }
      );
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json(
        { error: 'Character media directory not found.' },
        { status: 404 }
      );
    }
    throw error;
  }

  try {
    const [imageFiles, videoFiles] = await Promise.all([
      listFiles(imagesDir, IMAGE_EXTENSIONS),
      listFiles(videosDir, VIDEO_EXTENSIONS),
    ]);

    const images = imageFiles.map((file) => ({
      url: `/${characterId}/images/${encodeURIComponent(file.filename)}`,
      placeholder: null as string | null,
      label: file.label,
    }));

    const videos = videoFiles.map((file) => ({
      url: `/${characterId}/videos/${encodeURIComponent(file.filename)}`,
      thumbnailUrl: null as string | null,
      label: file.label,
    }));

    return NextResponse.json({
      characterId,
      images,
      videos,
    });
  } catch (error) {
    console.error('Failed to read predefined media', error);
    return NextResponse.json(
      { error: 'Unable to load predefined media assets.' },
      { status: 500 }
    );
  }
};
