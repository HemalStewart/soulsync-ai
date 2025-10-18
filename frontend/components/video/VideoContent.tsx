'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Image from 'next/image';
import {
  Download,
  Film,
  ImagePlus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/components/auth/AuthContext';
import CoinLimitModal from '@/components/coins/CoinLimitModal';
import { useCoins } from '@/components/coins/CoinContext';
import { COIN_COSTS } from '@/lib/coins';
import {
  CreateGeneratedVideoPayload,
  clearGeneratedVideos,
  createGeneratedVideo,
  deleteGeneratedVideo,
  listGeneratedVideos,
} from '@/lib/api';
import { GeneratedVideoRecord } from '@/lib/types';

type BuilderTab = 'image-to-video' | 'video-extend' | 'text-to-video';

const builderTabs: Array<{ id: BuilderTab; label: string; description: string; comingSoon?: boolean }> = [
  { id: 'image-to-video', label: 'Image to Video', description: 'Transform a single key frame into motion.', comingSoon: true },
  { id: 'video-extend', label: 'Video Extend', description: 'Grow an existing clip with seamless context.', comingSoon: true },
  { id: 'text-to-video', label: 'Text to Video', description: 'Generate cinematic moments from a prompt.' },
];
const VIDEO_GENERATION_COST = COIN_COSTS.generateVideo;

const GuestPrompt = () => {
  const { openAuthModal } = useAuth();

  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="animate-in fade-in zoom-in duration-500 rounded-2xl border border-gray-200 bg-white px-12 py-10 text-center shadow-xl transition-all hover:shadow-2xl hover:scale-105">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
          <svg
            className="h-8 w-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to continue</h2>
        <p className="text-sm text-gray-600">
          Log in or create an account to access this feature.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="mt-6 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

const VideoContent = () => {
  const { user, loading } = useAuth();
  const { balance, setBalance, refresh: refreshCoinBalance } = useCoins();
  const [activeTab, setActiveTab] = useState<BuilderTab>('text-to-video');
  const [textPrompt, setTextPrompt] = useState('');
  const [showGallery, setShowGallery] = useState(true);
  const [videos, setVideos] = useState<GeneratedVideoRecord[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [showCoinModal, setShowCoinModal] = useState(false);
  const generationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const textCount = useMemo(() => textPrompt.length, [textPrompt]);
  const activeTabMeta = useMemo(
    () => builderTabs.find((tab) => tab.id === activeTab),
    [activeTab],
  );
  const modeComingSoon = Boolean(activeTabMeta?.comingSoon);
  const canGenerate = !modeComingSoon && textPrompt.trim().length > 0;
  const latestVideo = videos[0] ?? null;

  useEffect(() => {
    if (!user) {
      setVideos([]);
      setLoadingVideos(false);
      return;
    }

    let isMounted = true;

    const load = async () => {
      try {
        setLoadingVideos(true);
        const records = await listGeneratedVideos(user.id);
        if (!isMounted) {
          return;
        }
        setVideos(records);
        setGenerationError(null);
      } catch (error) {
        if (!isMounted) {
          return;
        }
        const message =
          error instanceof Error
            ? error.message
            : 'Unable to load generated videos.';
        setGenerationError(message);
      } finally {
        if (isMounted) {
          setLoadingVideos(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    setGenerationError(null);
  }, [activeTab]);

  useEffect(
    () => () => {
      if (generationTimeoutRef.current) {
        clearTimeout(generationTimeoutRef.current);
      }
    },
    [],
  );

  const handleGenerateVideo = useCallback(async () => {
    if (modeComingSoon) {
      const label = builderTabs.find((tab) => tab.id === activeTab)?.label ?? 'This';
      setGenerationError(`${label} mode is coming soon. Please switch to Text to Video.`);
      return;
    }

    const resolvedPrompt = textPrompt.trim();

    if (!resolvedPrompt) {
      setGenerationError('Please enter a prompt to generate a video.');
      return;
    }

    if (balance !== null && balance < VIDEO_GENERATION_COST) {
      setShowCoinModal(true);
      setGenerationError('You need more coins to generate a video.');
      return;
    }

    const controller = new AbortController();
    setIsGenerating(true);
    setGenerationError(null);

    generationTimeoutRef.current = setTimeout(
      () => controller.abort(),
      120_000,
    );

    try {
      const response = await fetch('/api/video-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: resolvedPrompt,
        }),
        signal: controller.signal,
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(
          payload?.error || 'Failed to generate video.',
        ) as Error & { status?: number };
        error.status = response.status;
        throw error;
      }

      const remote = payload?.data ?? {};
      const videoUrl: string | undefined =
        remote.videoUrl || remote.url || remote.result;

      if (!videoUrl) {
        throw new Error('No video URL returned from the video service.');
      }

      const savePayload: CreateGeneratedVideoPayload = {
        remote_url: videoUrl,
        prompt: resolvedPrompt,
        model: 'minimax/video-01',
        duration_seconds: 6,
      };

      const { record, coinBalance } = await createGeneratedVideo(savePayload);
      if (typeof coinBalance === 'number') {
        setBalance(coinBalance);
      } else {
        void refreshCoinBalance();
      }

      setVideos((prev) => [record, ...prev]);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setGenerationError('Video generation timed out. Please try again.');
      } else {
        const status =
          typeof error === 'object' && error && 'status' in error
            ? (error as { status?: number }).status ?? null
            : null;

        if (status === 402) {
          setShowCoinModal(true);
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Unable to generate video right now.';
        setGenerationError(message);
      }
    } finally {
      setIsGenerating(false);
      if (generationTimeoutRef.current) {
        clearTimeout(generationTimeoutRef.current);
        generationTimeoutRef.current = null;
      }
      controller.abort();
    }
  }, [
    activeTab,
    balance,
    modeComingSoon,
    textPrompt,
    refreshCoinBalance,
    setBalance,
  ]);

  const handleRefreshVideos = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      setLoadingVideos(true);
      const records = await listGeneratedVideos(user.id);
      setVideos(records);
      setGenerationError(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to refresh videos.';
      setGenerationError(message);
    } finally {
      setLoadingVideos(false);
    }
  }, [user]);

  const handleDeleteVideo = useCallback(async (id: number) => {
    try {
      await deleteGeneratedVideo(id);
      setVideos((prev) => prev.filter((video) => video.id !== id));
      setGenerationError(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to delete video.';
      setGenerationError(message);
    }
  }, []);

  const handleClearVideos = useCallback(async () => {
    try {
      await clearGeneratedVideos();
      setVideos([]);
      setGenerationError(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to clear videos.';
      setGenerationError(message);
    }
  }, []);

  if (loading) {
    return (
      <AppLayout activeTab="video">
        <div className="flex flex-1 items-center justify-center bg-gray-50">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout activeTab="video">
        <GuestPrompt />
      </AppLayout>
    );
  }

  return (
    <>
    <AppLayout activeTab="video">
      <div className="flex flex-col bg-gray-50">
        <style>{`
          @keyframes fadeUp {
            0% { opacity: 0; transform: translateY(24px); }
            100% { opacity: 1; transform: translateY(0); }
          }

          @keyframes fadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }

          .animate-fade-up {
            opacity: 0;
            animation: fadeUp 0.5s ease forwards;
          }

          .animate-fade-in {
            opacity: 0;
            animation: fadeIn 0.4s ease forwards;
          }
        `}</style>
        <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-8 sm:px-6 sm:py-10">
          

          <section className="space-y-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-lg animate-fade-up" style={{ animationDelay: '0.12s' }}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Creation modes</h2>
                <p className="text-sm text-gray-600">
                  Pick a starting point, adjust the prompt, and generate a polished clip in seconds.
                </p>
              </div>
              <div className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white shadow">
                {VIDEO_GENERATION_COST} coins per render
              </div>
            </div>

            <div className="grid gap-3 rounded-2xl bg-blue-50/40 p-3 sm:grid-cols-3">
              {builderTabs.map((tab, index) => {
                const isActive = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col items-start rounded-xl border px-4 py-3 text-left transition ${
                      isActive
                        ? 'border-blue-600 bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg'
                        : 'border-transparent bg-white text-gray-800 shadow-sm hover:border-blue-200'
                    } animate-fade-up`}
                    style={{ animationDelay: `${0.18 + index * 0.06}s` }}
                  >
                    <span className="text-sm font-semibold">{tab.label}</span>
                    <span className={`mt-1 text-xs ${isActive ? 'text-gray-200' : 'text-gray-500'}`}>
                      {tab.description}
                    </span>
                    {tab.comingSoon && (
                      <span className={`mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'
                      }`}>
                        Coming soon
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-6 animate-fade-up" style={{ animationDelay: '0.22s' }}>
                {modeComingSoon && (
                  <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 p-8 text-center text-sm text-blue-600">
                    <Sparkles className="mb-3 h-8 w-8 text-blue-500" />
                    <p className="font-semibold">
                      {activeTabMeta?.label} mode is coming soon.
                    </p>
                    <p className="mt-1 text-blue-500/80">
                      We&apos;re still polishing this workflow. Switch to Text to Video to render clips right now.
                    </p>
                  </div>
                )}

                {!modeComingSoon && activeTab === 'text-to-video' && (
                  <>
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-900">
                        Looks like (optional)
                      </label>
                      <div className="flex items-center gap-4">
                        <button className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-blue-200 bg-white text-blue-500 transition hover:border-blue-500 hover:text-blue-700">
                          <ImagePlus className="h-6 w-6" />
                          <span className="absolute -top-2 -right-2 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                            Pro
                          </span>
                        </button>
                        <p className="text-xs text-gray-500">
                          Add a reference image to guide style, color, and cinematography.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-900">
                        Prompt
                      </label>
                      <div className="relative">
                        <textarea
                          value={textPrompt}
                          onChange={(event) => setTextPrompt(event.target.value.slice(0, 800))}
                          placeholder="Summon a sweeping cityscape, neon reflections, and slow pan..."
                          className="h-36 w-full rounded-2xl border border-gray-200 bg-blue-50/40 p-4 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                          maxLength={800}
                        />
                        <span className="absolute bottom-3 right-4 text-xs text-gray-500">
                          {textCount}/800
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-6 text-white shadow-xl animate-fade-up" style={{ animationDelay: '0.25s' }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-blue-100/80">Preview</p>
                    <h3 className="text-xl font-semibold">Hero story reel</h3>
                  </div>
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                    1080p
                  </span>
                </div>
                <div className="mt-4 flex-1 overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600/80 p-2 shadow-inner">
                  {latestVideo ? (
                    <video
                      key={latestVideo.id}
                      controls
                      className="h-56 w-full rounded-lg object-cover"
                      src={latestVideo.remote_url}
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center text-sm text-blue-50">
                      <Sparkles className="h-8 w-8 text-white drop-shadow" />
                      <p>Your next masterpiece will appear here once rendered.</p>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-blue-50">
                  <span className="rounded-full bg-white/20 px-3 py-1">Motion boost</span>
                  <span className="rounded-full bg-white/20 px-3 py-1">Camera pan</span>
                  <span className="rounded-full bg-white/20 px-3 py-1">Loop safe</span>
                </div>
                <button
                  onClick={handleGenerateVideo}
                  disabled={isGenerating || !canGenerate}
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 text-sm font-semibold text-white shadow-lg transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {modeComingSoon ? (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Coming soon
                    </>
                  ) : isGenerating ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate video
                    </>
                  )}
                  <span className="rounded-full bg-white/20 px-2 py-1 text-xs font-semibold text-white/90">
                    {VIDEO_GENERATION_COST} coins
                  </span>
                </button>
                {generationError && (
                  <div className="mt-3 w-full rounded-lg bg-red-500/25 px-3 py-2 text-xs font-semibold text-red-50">
                    {generationError}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-lg animate-fade-up" style={{ animationDelay: '0.18s' }}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Video gallery</h2>
                <p className="text-sm text-gray-600">
                  Clips expire after 30 days. Save or export them to keep forever.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowGallery((prev) => !prev)}
                  className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  {showGallery ? 'Hide gallery' : 'Show gallery'}
                </button>
                <button
                  onClick={handleRefreshVideos}
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingVideos ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                {videos.length > 0 && (
                  <button
                    onClick={handleClearVideos}
                    className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {showGallery ? (
              loadingVideos ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center text-sm text-gray-500">
                  <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
                  Loading your recent videos…
                </div>
              ) : videos.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center text-sm text-gray-500">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-inner">
                    <Film className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="mt-4 font-semibold text-gray-900">No renders yet</p>
                  <p>Generate a video to see it appear here.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {videos.map((video, index) => (
                    <div
                      key={video.id}
                      className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg animate-fade-up"
                      style={{ animationDelay: `${0.24 + index * 0.05}s` }}
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
                        <span className="absolute top-3 left-3 rounded-full bg-blue-600/80 px-3 py-1 text-xs font-medium text-white">
                          {video.duration_seconds ?? 6}s
                        </span>
                      </div>
                      <div className="space-y-3 p-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 line-clamp-2">
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
                            onClick={() => handleDeleteVideo(video.id)}
                            className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center text-sm text-gray-500">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-inner">
                  <Film className="h-8 w-8 text-gray-400" />
                </div>
                <p className="mt-4 font-semibold text-gray-900">Gallery collapsed</p>
                <p>Toggle the gallery to review previous renders.</p>
              </div>
            )}
          </section>

        </div>
      </div>
    </AppLayout>
    <CoinLimitModal
      open={showCoinModal}
      onClose={() => setShowCoinModal(false)}
    />
    </>
  );
};

export default VideoContent;
