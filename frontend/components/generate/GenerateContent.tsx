'use client';

import {
  ChangeEvent,
  JSX,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Image from 'next/image';
import {
  Camera,
  Download,
  Image as ImageIcon,
  ImagePlus,
  Maximize2,
  Monitor,
  Palette,
  Sparkles,
  Square,
  Sword,
  Trash2,
  Tv,
  Wand2,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/components/auth/AuthContext';
import CoinLimitModal from '@/components/coins/CoinLimitModal';
import { useCoins } from '@/components/coins/CoinContext';
import { COIN_COSTS } from '@/lib/coins';
import {
  CreateGeneratedImagePayload,
  clearGeneratedImages,
  createGeneratedImage,
  deleteGeneratedImage,
  listGeneratedImages,
} from '@/lib/api';
import { GeneratedImageRecord } from '@/lib/types';

const IMAGE_GENERATION_COST = COIN_COSTS.generateImage;

// --- Shared Types and Data (Kept from original file) ---

type StyleId = 'realistic' | 'anime' | 'fantasy' | 'cinematic';
type AspectRatioId = '1:1' | '9:16' | '16:9' | '3:4' | '4:3';


type StoredImage = Omit<GeneratedImageRecord, 'style' | 'aspect_ratio'> & {
  style: StyleId;
  aspect_ratio: AspectRatioId;
};

const styleOptions: Array<{
  id: StyleId;
  label: string;
  description: string;
  icon: JSX.Element;
}> = [
  {
    id: 'realistic',
    label: 'Realistic',
    description: 'Photographic lighting & detail',
    icon: <Camera className="h-4 w-4 text-blue-600" />,
  },
  {
    id: 'anime',
    label: 'Anime',
    description: 'Bold shading & stylised colour',
    icon: <Sparkles className="h-4 w-4 text-blue-600" />,
  },
  {
    id: 'fantasy',
    label: 'Fantasy',
    description: 'Epic scenes & magical moods',
    icon: <Sword className="h-4 w-4 text-blue-600" />,
  },
  {
    id: 'cinematic',
    label: 'Cinematic',
    description: 'Film-grade composition',
    icon: <Palette className="h-4 w-4 text-blue-600" />,
  },
];

const aspectOptions: Array<{
  id: AspectRatioId;
  label: string;
  icon: JSX.Element;
}> = [
  {
    id: '1:1',
    label: 'Square',
    icon: <Square className="h-5 w-5 text-blue-600" />,
  },
  {
    id: '9:16',
    label: 'Portrait',
    icon: <ImagePlus className="h-5 w-5 text-blue-600 rotate-90" />,
  },
  {
    id: '3:4',
    label: 'Classic portrait',
    icon: <ImagePlus className="h-5 w-5 text-blue-600" />,
  },
  {
    id: '16:9',
    label: 'Widescreen',
    icon: <Tv className="h-5 w-5 text-blue-600" />,
  },
  {
    id: '4:3',
    label: 'Landscape',
    icon: <Monitor className="h-5 w-5 text-blue-600" />,
  },
];

const qualityLabels = ['Draft', 'Standard', 'High', 'Ultra', 'Max'];

const stylePromptHints: Record<StyleId, string> = {
  realistic: 'photorealistic, ultra-detailed, natural lighting',
  anime: 'anime illustration, vibrant colors, clean cel shading',
  fantasy: 'fantasy concept art, ethereal atmosphere, high detail',
  cinematic: 'cinematic lighting, 35mm film still, dramatic composition',
};

const normalizeStyle = (value: string): StyleId => {
  const styles: StyleId[] = ['realistic', 'anime', 'fantasy', 'cinematic'];
  return styles.includes(value as StyleId) ? (value as StyleId) : 'realistic';
};

const normalizeAspectRatio = (value: string): AspectRatioId => {
  const ratios: AspectRatioId[] = ['1:1', '9:16', '16:9', '3:4', '4:3'];
  if (ratios.includes(value as AspectRatioId)) {
    return value as AspectRatioId;
  }

  switch (value) {
    case '2:3':
      return '3:4';
    case '3:2':
      return '4:3';
    default:
      return '1:1';
  }
};

// --- GuestPrompt Component (Kept from original file) ---

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

// --- GenerateContent Component (Refactored Layout) ---

const GenerateContent = () => {
  const { user, loading } = useAuth();
  const { balance, setBalance, refresh: refreshCoinBalance } = useCoins();
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<StyleId>('realistic');
  const [selectedAspect, setSelectedAspect] = useState<AspectRatioId>('1:1');
  const [quality, setQuality] = useState(4);
  const [images, setImages] = useState<StoredImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [showCoinModal, setShowCoinModal] = useState(false);
  const generationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const promptCount = useMemo(() => prompt.length, [prompt]);
  const negativePromptCount = useMemo(() => negativePrompt.length, [negativePrompt]);
  const qualityLabel = useMemo(() => qualityLabels[quality - 1] ?? 'High', [quality]);

  const handlePromptChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const next = event.target.value.slice(0, 500);
    setPrompt(next);
  };

  const handleNegativePromptChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const next = event.target.value.slice(0, 200);
    setNegativePrompt(next);
  };

  const handleGenerate = useCallback(async () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      return;
    }

    if (balance !== null && balance < IMAGE_GENERATION_COST) {
      setShowCoinModal(true);
      setGenerationError('You need more coins to generate an image.');
      return;
    }

    const controller = new AbortController();
    setIsGenerating(true);
    setGenerationError(null);

    generationTimeoutRef.current = setTimeout(
      () => controller.abort(),
      60_000,
    );

    const styleHint = stylePromptHints[selectedStyle];
    const generationPrompt = styleHint
      ? `${trimmedPrompt}, ${styleHint}`
      : trimmedPrompt;
    const apiType = 'replicate/google/imagen-4';
    const negative = negativePrompt.trim();

    try {
      const response = await fetch('/api/image-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: generationPrompt,
          aspect_ratio: selectedAspect,
          negative_prompt: negative || undefined,
          safety_filter_level: 'block_medium_and_above',
          output_format: 'jpg',
          style: selectedStyle,
          quality,
        }),
        signal: controller.signal,
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to generate image.');
      }

      const remote = payload?.data ?? {};
      const imageUrl: string | undefined =
        remote.imageUrl ||
        remote.url ||
        remote.image ||
        remote.result ||
        payload?.imageUrl ||
        payload?.url;

      if (!imageUrl) {
        throw new Error('No image URL returned from the image service.');
      }

      const savePayload: CreateGeneratedImagePayload = {
        remote_url: imageUrl,
        prompt: trimmedPrompt,
        negative_prompt: negative || null,
        style: selectedStyle,
        aspect_ratio: selectedAspect,
        quality,
        api_type: apiType,
      };

      const { record, coinBalance } = await createGeneratedImage(savePayload);
      if (typeof coinBalance === 'number') {
        setBalance(coinBalance);
      } else {
        void refreshCoinBalance();
      }
      setImages((prev) => [
        {
          ...record,
          style: normalizeStyle(record.style),
          aspect_ratio: normalizeAspectRatio(record.aspect_ratio),
        },
        ...prev,
      ]);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setGenerationError('Image generation timed out. Please try again.');
      } else {
        const status =
          typeof error === 'object' && error && 'status' in error
            ? (error as { status?: number }).status ?? null
            : null;

        if (status === 402) {
          setShowCoinModal(true);
          const message =
            error instanceof Error
              ? error.message
              : 'You have run out of coins.';
          setGenerationError(message);
        } else {
          const message =
            error instanceof Error
              ? error.message
              : 'Unable to generate image right now.';
          setGenerationError(message);
        }
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
    balance,
    negativePrompt,
    prompt,
    quality,
    selectedAspect,
    selectedStyle,
    refreshCoinBalance,
    setBalance,
  ]);

  const handleClearGallery = async () => {
    try {
      await clearGeneratedImages();
      setImages([]);
      setGenerationError(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to clear gallery.';
      setGenerationError(message);
    }
  };

  const handleDeleteImage = async (id: number) => {
    try {
      await deleteGeneratedImage(id);
      setImages((prev) => prev.filter((image) => image.id !== id));
      setGenerationError(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to delete image.';
      setGenerationError(message);
    }
  };

  const handleDownload = (image: StoredImage) => {
    const link = document.createElement('a');
    link.href = image.remote_url;
    link.download = `soulsync-image-${image.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpscale = () => {
    alert('Upscale coming soon! Your image will gain extra detail.');
  };

  useEffect(() => {
    let isMounted = true;

    const load = async (userId: string) => {
      try {
        const records = await listGeneratedImages(userId);
        if (!isMounted) {
          return;
        }
        setImages(
          records.map((record) => ({
            ...record,
            style: normalizeStyle(record.style),
            aspect_ratio: normalizeAspectRatio(record.aspect_ratio),
          }))
        );
        setGenerationError(null);
      } catch (error) {
        if (!isMounted) {
          return;
        }
        const message =
          error instanceof Error
            ? error.message
            : 'Unable to load previously generated images.';
        setGenerationError(message);
      }
    };

    if (!user) {
      setImages([]);
      return () => {
        isMounted = false;
      };
    }

    load(user.id);

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(
    () => () => {
      if (generationTimeoutRef.current) {
        clearTimeout(generationTimeoutRef.current);
      }
    },
    []
  );

  if (loading) {
    return (
      <AppLayout activeTab="generate">
        <div className="flex flex-1 items-center justify-center bg-gray-50">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
        </div>
      </AppLayout>
    );
  }


  if (!user) {
    return (
      <AppLayout activeTab="generate">
        <GuestPrompt />
      </AppLayout>
    );
  }

  return (
    <>
      <AppLayout activeTab="generate">
      <div className="flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
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
          
          {/* Main content grid: Settings (left) vs. Gallery (right) */}
          {/* The flex-col on the left section ensures vertical stacking on all screens,
              while the grid container handles the side-by-side layout on 'lg'. */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.1fr),minmax(0,0.9fr)]">
            
            {/* LEFT SIDE: Settings (Stacked vertically) */}
            <section className="flex flex-col space-y-6">
                
                {/* 1. Prompt settings (Top Left Card) */}
                <div className="space-y-6 rounded-3xl border border-blue-100 bg-white p-6 shadow-lg animate-fade-up" style={{ animationDelay: '0.12s' }}>
                    <div className="flex items-center justify-between">
                        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                            <Sparkles className="h-5 w-5 text-blue-600" />
                            Prompt settings
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white shadow-sm">
                                {IMAGE_GENERATION_COST} coins per render
                            </span>
                            {/* <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                                Required
                            </span> */}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-900">
                                Main prompt <span className="text-red-500">*</span>
                            </label>
                            <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-1">
                                <textarea
                                    value={prompt}
                                    onChange={handlePromptChange}
                                    placeholder="Describe the scene you imagine in vivid detail..."
                                    rows={4}
                                    className="h-full w-full resize-none rounded-2xl border-none bg-transparent px-4 py-3 text-sm text-gray-900 outline-none focus:ring-0"
                                />
                            </div>
                            <div className="mt-2 flex items-center justify-between text-xs">
                                <span className="text-gray-500">Be specific about subject, mood, lighting, and colours.</span>
                                <span className={promptCount >= 500 ? 'font-medium text-red-500' : 'text-gray-400'}>
                                    {promptCount}/500
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-900">
                                Negative prompt <span className="text-gray-400">(optional)</span>
                            </label>
                            <div className="rounded-2xl border border-blue-50 bg-white p-1">
                                <textarea
                                    value={negativePrompt}
                                    onChange={handleNegativePromptChange}
                                    placeholder="Describe anything you want the model to avoid..."
                                    rows={3}
                                    className="h-full w-full resize-none rounded-2xl border-none bg-transparent px-4 py-3 text-sm text-gray-900 outline-none focus:ring-0"
                                />
                            </div>
                            <div className="mt-2 flex items-center justify-between text-xs">
                                <span className="text-gray-500">Keep prompts concise—use commas to separate items.</span>
                                <span className={negativePromptCount >= 200 ? 'font-medium text-red-500' : 'text-gray-400'}>
                                    {negativePromptCount}/200
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Advanced controls (Bottom Left Card) */}
                <div className="space-y-6 rounded-3xl border border-blue-100 bg-white p-6 shadow-lg animate-fade-up" style={{ animationDelay: '0.16s' }}>
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                        <Wand2 className="h-5 w-5 text-blue-600" />
                        Advanced controls
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <p className="mb-3 text-sm font-semibold text-gray-900">Generation style</p>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {styleOptions.map((option, index) => {
                                    const active = option.id === selectedStyle;
                                    return (
                                        <button
                                            key={option.id}
                                            onClick={() => setSelectedStyle(option.id)}
                                            className={`flex flex-col rounded-2xl border p-4 text-left transition ${
                                            active
                                                ? 'border-blue-600 bg-blue-50 shadow'
                                                : 'border-blue-100 bg-white hover:border-blue-300'
                                            } animate-fade-up`}
                                            style={{ animationDelay: `${0.18 + index * 0.05}s` }}
                                        >
                                            <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                                                {option.icon}
                                                {option.label}
                                            </span>
                                            <span className="mt-1 text-xs text-gray-500">
                                                {option.description}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <p className="mb-3 text-sm font-semibold text-gray-900">Aspect ratio</p>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {aspectOptions.map((option, index) => {
                                    const active = option.id === selectedAspect;
                                    return (
                                        <button
                                            key={option.id}
                                            onClick={() => setSelectedAspect(option.id)}
                                            className={`flex min-w-[120px] flex-1 flex-col items-center rounded-2xl border px-4 py-3 text-center transition ${
                                            active
                                                ? 'border-blue-600 bg-blue-50 text-blue-700 shadow'
                                                : 'border-blue-100 bg-white text-gray-700 hover:border-blue-300'
                                            } animate-fade-up`}
                                            style={{ animationDelay: `${0.2 + index * 0.05}s` }}
                                        >
                                            {option.icon}
                                            <span className="mt-2 text-xs font-semibold">{option.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <div className="mb-3 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">Image quality</p>
                                    <p className="text-xs text-gray-500">Balance render speed with fine detail.</p>
                                </div>
                                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                                    {qualityLabel}
                                </span>
                            </div>
                            <div className="space-y-2">
                                <input
                                    type="range"
                                    min={1}
                                    max={5}
                                    value={quality}
                                    onChange={(event) => setQuality(Number(event.target.value))}
                                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-blue-100 accent-blue-600"
                                />
                                <div className="flex justify-between text-[11px] text-gray-500">
                                    {qualityLabels.map((label) => (
                                        <span key={label}>{label}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 text-sm font-semibold text-white shadow-lg transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                        {isGenerating ? (
                            <>
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Wand2 className="h-4 w-4" />
                                Generate image
                  </>
                )}
                <span className="rounded-full bg-white/20 px-2 py-1 text-xs font-semibold text-white/90">
                  {IMAGE_GENERATION_COST} coins
                </span>
              </button>
      {generationError && (
        <p className="text-sm font-semibold text-red-600">{generationError}</p>
      )}
            </div>
            </section>
            
            {/* RIGHT SIDE: Generated images (Spans the full height) */}
            <section className="flex flex-col space-y-6">
              <div className="space-y-4 rounded-3xl border border-blue-100 bg-white p-6 shadow-lg animate-fade-up" style={{ animationDelay: '0.18s' }}>
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <ImageIcon className="h-5 w-5 text-blue-600" />
                    Generated images
                  </h2>
                  {images.length > 0 && (
                    <button
                      onClick={handleClearGallery}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-500 transition hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear all
                    </button>
                  )}
                </div>
                <div className="rounded-2xl border border-dashed border-blue-100 bg-blue-50/40 p-6 text-sm text-gray-600">
                  Images stay visible for 30 days. Save locally or upscale for higher fidelity exports.
                </div>
              </div>

              <div className="flex-1 overflow-hidden rounded-3xl border border-blue-100 bg-white p-6 shadow-lg animate-fade-up" style={{ animationDelay: '0.22s' }}>
                {images.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center text-sm text-gray-500">
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                      <ImageIcon className="h-10 w-10" />
                    </div>
                    <p className="text-base font-semibold text-gray-900">Your creations will appear here</p>
                    <p className="mt-2 max-w-xs">
                      Enter a prompt on the left and click &ldquo;Generate image&rdquo; to see the gallery come alive.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {images.map((image, index) => (
                      <div
                        key={image.id}
                        className="group overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg animate-fade-up"
                        style={{ animationDelay: `${0.26 + index * 0.05}s` }}
                      >
                        <div className="relative w-full overflow-hidden aspect-square">
                          <Image
                            src={image.remote_url}
                            alt={image.prompt}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover transition duration-500 group-hover:scale-105"
                            unoptimized
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-blue-900/0 transition group-hover:bg-blue-900/40">
                            <div className="flex translate-y-3 gap-2 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                              <button
                                onClick={() => handleDownload(image)}
                                className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-blue-50"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                              <button
                                onClick={handleUpscale}
                                className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-blue-50"
                              >
                                <Maximize2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteImage(image.id)}
                                className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3 p-4">
                          <p className="line-clamp-2 text-sm text-gray-700">{image.prompt}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span className="capitalize">{image.style}</span>
                            <span>{image.aspect_ratio}</span>
                            <span>{qualityLabels[image.quality - 1] ?? image.quality}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
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

export default GenerateContent;
