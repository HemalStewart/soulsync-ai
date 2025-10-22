'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Download, Film, RefreshCw, Trash2, Video } from 'lucide-react';
import { useRouter } from 'next/navigation';

import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/components/auth/AuthContext';
import {
  clearGeneratedVideos,
  deleteGeneratedVideo,
  listGeneratedVideos,
} from '@/lib/api';
import { GeneratedVideoRecord } from '@/lib/types';

const MyVideosContent = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [videos, setVideos] = useState<GeneratedVideoRecord[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  const loadVideos = useCallback(async () => {
    if (!user) {
      setVideos([]);
      setError(null);
      return;
    }

    try {
      setLoadingVideos(true);
      const records = await listGeneratedVideos(user.id);
      setVideos(records);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load generated videos right now.'
      );
    } finally {
      setLoadingVideos(false);
    }
  }, [user]);

  useEffect(() => {
    if (loading) {
      return;
    }
    loadVideos();
  }, [loading, loadVideos]);

  const handleRefresh = useCallback(() => {
    loadVideos();
  }, [loadVideos]);

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await deleteGeneratedVideo(id);
        setVideos((prev) => prev.filter((video) => video.id !== id));
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to delete this video.'
        );
      }
    },
    []
  );

  const handleClearAll = useCallback(async () => {
    try {
      setClearing(true);
      await clearGeneratedVideos();
      setVideos([]);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to clear your videos right now.'
      );
    } finally {
      setClearing(false);
    }
  }, []);

  const handleCreateNew = useCallback(() => {
    router.push('/video');
  }, [router]);

  const content = useMemo(() => {
    if (loading || loadingVideos) {
      return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-12 text-sm text-gray-500">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          Loading your video gallery…
        </div>
      );
    }

    if (!user) {
      return (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
          <h2 className="text-lg font-semibold text-gray-900">Sign in to view your videos</h2>
          <p className="mt-2 text-sm text-gray-600">
            Log in to manage the clips you have generated.
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      );
    }

    if (!videos.length) {
      return (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-inner">
            <Film className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="mt-6 text-lg font-semibold text-gray-900">No videos yet</h2>
          <p className="mt-2 text-sm text-gray-600">
            Generate a video to see it appear in your gallery.
          </p>
          <button
            onClick={handleCreateNew}
            className="mt-4 inline-flex items-center gap-2 rounded-lg brand-gradient px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-brand-primary-strong"
          >
            <Video className="h-4 w-4" />
            Create video
          </button>
        </div>
      );
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video, index) => (
          <div
            key={video.id}
            className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            style={{ animationDelay: `${0.2 + index * 0.05}s` }}
          >
            <div className="relative h-44 w-full overflow-hidden">
              {video.thumbnail_url ? (
                <Image
                  src={video.thumbnail_url}
                  alt={video.prompt}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <video
                  src={video.remote_url}
                  className="h-full w-full object-cover"
                  controls
                />
              )}
              <span
                className="absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm"
                style={{ backgroundColor: 'var(--brand-primary)' }}
              >
                {video.duration_seconds ?? 6}s
              </span>
            </div>
            <div className="space-y-3 p-4">
              <div>
                <p className="line-clamp-2 text-sm font-semibold text-gray-900">
                  {video.prompt}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(video.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <a
                  href={video.remote_url}
                  download
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  <Download className="h-4 w-4" />
                  Download
                </a>
                <button
                  onClick={() => handleDelete(video.id)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }, [error, handleDelete, handleCreateNew, loading, loadingVideos, user, videos]);

  return (
    <AppLayout activeTab="video">
      <div className="flex-1 overflow-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Video gallery</h1>
              <p className="text-sm text-gray-600">
                Review, download, and manage the videos you have generated.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleRefresh}
                disabled={loadingVideos}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${loadingVideos ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              {videos.length > 0 && (
                <button
                  onClick={handleClearAll}
                  disabled={clearing}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  {clearing ? 'Clearing…' : 'Clear all'}
                </button>
              )}
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center gap-2 rounded-lg brand-gradient px-3 py-2 text-sm font-semibold text-white shadow transition hover:bg-brand-primary-strong"
              >
                <Video className="h-4 w-4" />
                New video
              </button>
            </div>
          </div>

          {content}
        </div>
      </div>
    </AppLayout>
  );
};

export default MyVideosContent;
