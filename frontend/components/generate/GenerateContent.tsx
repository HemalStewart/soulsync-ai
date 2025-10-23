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
  Coins,
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
  RefreshCw,
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

type StyleId = 'analog' | 'anime' | 'cinematic' | 'comic' | 'model3d';
type AspectRatioId = '1:1' | '9:16' | '16:9' | '3:4' | '4:3';

type StoredImage = Omit<GeneratedImageRecord, 'style' | 'aspect_ratio'> & {
  style: StyleId;
  aspect_ratio: AspectRatioId;
};

const DATA_URL_PATTERN = /^data:([^;,]+);base64,/i;
const DEFAULT_DOWNLOAD_EXTENSION = 'webp';
const EXTENSION_TO_MIME: Record<string, string> = {
  webp: 'image/webp',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
};
const MIME_TO_EXTENSION: Record<string, string> = {
  'image/webp': 'webp',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
};

const normaliseExtension = (value: string | undefined): string => {
  if (!value) {
    return DEFAULT_DOWNLOAD_EXTENSION;
  }
  const candidate = value.toLowerCase();
  if (candidate in EXTENSION_TO_MIME) {
    return candidate === 'jpeg' ? 'jpg' : candidate;
  }
  if (candidate === 'jpeg') {
    return 'jpg';
  }
  if (candidate === 'jpe') {
    return 'jpg';
  }
  return DEFAULT_DOWNLOAD_EXTENSION;
};

const inferDownloadInfo = (
  remoteUrl: string
): { extension: string; mimeType: string } => {
  let extension = DEFAULT_DOWNLOAD_EXTENSION;
  let mimeType = EXTENSION_TO_MIME[extension];

  const dataUrlMatch = DATA_URL_PATTERN.exec(remoteUrl);
  if (dataUrlMatch?.[1]) {
    const candidateMime = dataUrlMatch[1].toLowerCase();
    const mappedExtension =
      MIME_TO_EXTENSION[candidateMime] ??
      normaliseExtension(candidateMime.split('/').pop());
    extension = mappedExtension;
    mimeType = EXTENSION_TO_MIME[extension] ?? candidateMime;
    return { extension, mimeType };
  }

  try {
    const parsed = new URL(remoteUrl);
    const pathMatch = parsed.pathname
      .toLowerCase()
      .match(/\.([a-z0-9]+)$/);
    if (pathMatch?.[1]) {
      extension = normaliseExtension(pathMatch[1]);
      mimeType = EXTENSION_TO_MIME[extension] ?? mimeType;
      return { extension, mimeType };
    }
  } catch {
    // Ignore URL parse errors; fall back to regex matching below.
  }

  const fallbackMatch = remoteUrl.toLowerCase().match(/\.([a-z0-9]+)$/);
  if (fallbackMatch?.[1]) {
    extension = normaliseExtension(fallbackMatch[1]);
    mimeType = EXTENSION_TO_MIME[extension] ?? mimeType;
  }

  return { extension, mimeType };
};

const styleOptions: Array<{
  id: StyleId;
  label: string;
  description: string;
  icon: JSX.Element;
}> = [
  {
    id: 'analog',
    label: 'Analog Film',
    description: 'Natural lighting & timeless detail',
    icon: <Camera className="h-4 w-4 text-brand-primary" />,
  },
  {
    id: 'anime',
    label: 'Anime',
    description: 'Bold shading & stylised colour',
    icon: <Sparkles className="h-4 w-4 text-brand-primary" />,
  },
  {
    id: 'comic',
    label: 'Comic Book',
    description: 'Bold line art & dynamic colour',
    icon: <Sword className="h-4 w-4 text-brand-primary" />,
  },
  {
    id: 'cinematic',
    label: 'Cinematic',
    description: 'Film-grade composition',
    icon: <Palette className="h-4 w-4 text-brand-primary" />,
  },
  {
    id: 'model3d',
    label: '3D Model',
    description: 'Stylised renders with depth',
    icon: <Monitor className="h-4 w-4 text-brand-primary" />,
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
    icon: <Square className="h-5 w-5 text-brand-primary" />,
  },
  {
    id: '9:16',
    label: 'Portrait',
    icon: <ImagePlus className="h-5 w-5 text-brand-primary rotate-90" />,
  },
  {
    id: '3:4',
    label: 'Classic portrait',
    icon: <ImagePlus className="h-5 w-5 text-brand-primary" />,
  },
  {
    id: '16:9',
    label: 'Widescreen',
    icon: <Tv className="h-5 w-5 text-brand-primary" />,
  },
  {
    id: '4:3',
    label: 'Landscape',
    icon: <Monitor className="h-5 w-5 text-brand-primary" />,
  },
];

const qualityLabels = ['Draft', 'Standard', 'High', 'Ultra', 'Max'];

const stylePromptHints: Record<StyleId, string> = {
  analog: 'analog film photography, soft grain, natural lighting',
  anime: 'anime illustration, vibrant colors, clean cel shading',
  comic: 'comic book illustration, bold ink, dynamic shading',
  cinematic: 'cinematic lighting, 35mm film still, dramatic composition',
  model3d: '3d render, volumetric lighting, high polygon detail',
};

const normalizeStyle = (value: string): StyleId => {
  const styles: StyleId[] = ['analog', 'anime', 'cinematic', 'comic', 'model3d'];
  if (styles.includes(value as StyleId)) {
    return value as StyleId;
  }

  const legacyMap: Record<string, StyleId> = {
    realistic: 'analog',
    fantasy: 'comic',
  };

  return legacyMap[value as keyof typeof legacyMap] ?? 'analog';
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

const GuestPrompt = () => {
  const { openAuthModal } = useAuth();

  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="animate-in fade-in zoom-in duration-500 rounded-2xl border border-gray-200 bg-white px-6 sm:px-12 py-8 sm:py-10 text-center shadow-xl transition-all hover:shadow-2xl hover:scale-105 max-w-sm">
        <div className="mx-auto mb-4 flex h-14 sm:h-16 w-14 sm:w-16 items-center justify-center rounded-xl brand-gradient shadow-brand flex-shrink-0">
          <svg
            className="h-7 sm:h-8 w-7 sm:w-8 text-white"
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
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Sign in to continue</h2>
        <p className="text-xs sm:text-sm text-gray-600">
          Log in or create an account to access this feature.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="mt-6 rounded-xl brand-gradient px-6 sm:px-8 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-brand hover:scale-105 active:scale-95"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

const GenerateContent = () => {
  const { user, loading } = useAuth();
  const { balance, setBalance, refresh: refreshCoinBalance } = useCoins();
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<StyleId>('analog');
  const [selectedAspect, setSelectedAspect] = useState<AspectRatioId>('1:1');
  const [quality, setQuality] = useState(4);
  const [images, setImages] = useState<StoredImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [showCoinModal, setShowCoinModal] = useState(false);
  const [imagesLoading, setImagesLoading] = useState(false);
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
    const apiType = 'venice/image/generate';
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
          output_format: 'webp',
          negative_prompt: negative || undefined,
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

  const handleLoadImages = useCallback(async () => {
    if (!user) {
      setImages([]);
      return;
    }

    try {
      setImagesLoading(true);
      const records = await listGeneratedImages(user.id);
      setImages(
        records.map((record) => ({
          ...record,
          style: normalizeStyle(record.style),
          aspect_ratio: normalizeAspectRatio(record.aspect_ratio),
        }))
      );
      setGenerationError(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to load your images right now.';
      setGenerationError(message);
    } finally {
      setImagesLoading(false);
    }
  }, [user]);

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
    const { extension, mimeType } = inferDownloadInfo(image.remote_url);
    const link = document.createElement('a');
    link.href = image.remote_url;
    link.download = `soulsync-image-${image.id}.${extension}`;
    link.type = mimeType;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpscale = () => {
    alert('Upscale coming soon! Your image will gain extra detail.');
  };

  useEffect(() => {
    if (loading) {
      return;
    }
    handleLoadImages();
  }, [loading, handleLoadImages]);

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
        <div id="generate-page-root" className="flex flex-1 items-center justify-center bg-gray-50">
          <div
            className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200"
            style={{ borderTopColor: 'var(--brand-primary)' }}
          />
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
        <div className="flex flex-1 flex-col bg-gray-50 min-h-0">
          <div className="flex-1 overflow-y-auto">
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
            <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
            
            {/* Prompt Settings Section */}
            <section className="space-y-6 sm:space-y-8 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm animate-fade-up" style={{ animationDelay: '0.12s' }}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Generate images
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Create AI-powered artwork with custom styles and precise control.
                  </p>
                </div>

                <span className="coin-pill whitespace-nowrap inline-flex">
                  <span className="coin-pill__icon">
                    <Coins className="h-3.5 w-3.5" />
                  </span>
                  <span className="coin-pill__text">
                    {IMAGE_GENERATION_COST} coins per image
                  </span>
                </span>
              </div>


              {generationError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-red-700">
                  {generationError}
                </div>
              )}

              <div className="space-y-6 sm:space-y-8">
                <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
                  {/* Prompt input card */}
                  <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 sm:p-6 shadow-sm">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Prompt editor</h3>
                    <p className="mt-1 text-xs sm:text-sm text-gray-500">
                      Be specific about subject, mood, lighting, and colors.
                    </p>
                  </div>

                  <div className="lg:col-span-2 space-y-4 sm:space-y-6 rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-700">
                        Main prompt <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={prompt}
                        onChange={handlePromptChange}
                        placeholder="Describe the scene you imagine in vivid detail..."
                        rows={4}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-primary focus:outline-none focus:ring-brand"
                      />
                      <div className={`mt-2 text-xs ${promptCount >= 500 ? 'font-medium text-red-500' : 'text-gray-400'}`}>
                        {promptCount}/500
                      </div>
                    </div>

                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-700">
                        Negative prompt <span className="text-gray-400">(optional)</span>
                      </label>
                      <textarea
                        value={negativePrompt}
                        onChange={handleNegativePromptChange}
                        placeholder="Describe anything you want the model to avoid..."
                        rows={3}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-primary focus:outline-none focus:ring-brand"
                      />
                      <div className={`mt-2 text-xs ${negativePromptCount >= 200 ? 'font-medium text-red-500' : 'text-gray-400'}`}>
                        {negativePromptCount}/200
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advanced Controls */}
                <div className="space-y-6 sm:space-y-8 rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                      Generation style
                    </h3>
                    <div className="grid grid-cols-1 gap-2 sm:gap-3 sm:grid-cols-2">
                      {styleOptions.map((option) => {
                        const active = option.id === selectedStyle;
                        return (
                          <button
                            key={option.id}
                            onClick={() => setSelectedStyle(option.id)}
                            className={`flex flex-col rounded-lg border px-3 sm:px-4 py-3 sm:py-4 text-left transition ${
                              active
                                ? 'border-brand-primary bg-brand-tint shadow-sm'
                                : 'border-gray-300 bg-white hover:border-brand-primary'
                            }`}
                          >
                            <span className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-900">
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
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                      Aspect ratio
                    </h3>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      {aspectOptions.map((option) => {
                        const active = option.id === selectedAspect;
                        return (
                          <button
                            key={option.id}
                            onClick={() => setSelectedAspect(option.id)}
                            className={`flex flex-col items-center rounded-lg border px-3 sm:px-4 py-2 sm:py-3 text-center transition min-w-[100px] sm:min-w-[120px] ${
                              active
                                ? 'border-brand-primary bg-brand-soft text-brand-primary shadow-sm'
                                : 'border-gray-300 bg-white text-gray-700 hover:border-brand-primary'
                            }`}
                          >
                            {option.icon}
                            <span className="mt-1 text-xs font-semibold">{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-gray-900">Image quality</p>
                        <p className="text-xs text-gray-500">Balance render speed with fine detail.</p>
                      </div>
                      <span className="bg-brand-soft px-2.5 sm:px-3 py-1 text-xs font-semibold text-brand-primary whitespace-nowrap rounded">
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
                        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-brand-soft"
                        style={{ accentColor: 'var(--brand-primary)' }}
                      />
                      <div className="flex justify-between text-[11px] text-gray-500">
                        {qualityLabels.map((label) => (
                          <span key={label}>{label}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className="w-full flex items-center justify-center gap-2 rounded-lg brand-gradient px-4 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-white shadow-brand transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                  >
                    {isGenerating ? (
                      <>
                        <span className="h-3.5 sm:h-4 w-3.5 sm:w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4" />
                        Generate image
                      </>
                    )}
                  </button>
                </div>
              </div>
            </section>

            {/* Generated Images Section */}
            <section className="space-y-4 sm:space-y-6 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    Generated images
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    Your creations stay visible for 30 days. Download or upscale for higher fidelity.
                  </p>
                </div>
                <div className="flex gap-2 sm:gap-3">
                  <button
                    onClick={handleLoadImages}
                    disabled={imagesLoading}
                    className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap"
                  >
                    <RefreshCw className={`h-3.5 sm:h-4 w-3.5 sm:w-4 ${imagesLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  {images.length > 0 && (
                    <button
                      onClick={handleClearGallery}
                      className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-gray-700 transition hover:bg-gray-50 whitespace-nowrap"
                    >
                      <Trash2 className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div>
                {imagesLoading ? (
                  <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div
                        key={`image-skeleton-${index}`}
                        className="h-40 sm:h-48 rounded-lg border border-gray-200 bg-gray-100 animate-pulse"
                      />
                    ))}
                  </div>
                ) : images.length ? (
                  <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {images.map((image) => (
                      <div
                        key={image.id}
                        className="group rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm transition hover:border-brand-primary hover:-translate-y-1 hover:shadow-brand"
                      >
                        <div className="relative w-full overflow-hidden aspect-square">
                          {image.remote_url.startsWith('data:') ? (
                            <img
                              src={image.remote_url}
                              alt={image.prompt}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <Image
                              src={image.remote_url}
                              alt={image.prompt}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className="object-cover transition duration-500 group-hover:scale-105"
                              unoptimized
                            />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-transparent transition group-hover:bg-[rgba(124,58,237,0.2)]">
                            <div className="flex translate-y-2 gap-1 sm:gap-2 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                              <button
                                onClick={() => handleDownload(image)}
                                className="rounded bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-gray-700 transition hover:bg-brand-tint"
                                title="Download"
                              >
                                <Download className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                              </button>
                              <button
                                onClick={handleUpscale}
                                className="rounded bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-gray-700 transition hover:bg-brand-tint"
                                title="Upscale"
                              >
                                <Maximize2 className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteImage(image.id)}
                                className="rounded bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2 p-3 sm:p-4">
                          <p className="line-clamp-2 text-xs sm:text-sm text-gray-700">{image.prompt}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span className="capitalize">{image.style}</span>
                            <span>{image.aspect_ratio}</span>
                            <span>{qualityLabels[image.quality - 1] ?? image.quality}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 sm:px-6 py-8 sm:py-12 text-center text-xs sm:text-sm text-gray-600">
                    <div className="mx-auto mb-4 flex h-12 sm:h-16 w-12 sm:w-16 items-center justify-center rounded-lg bg-brand-tint text-brand-primary">
                      <ImageIcon className="h-6 sm:h-8 w-6 sm:w-8" />
                    </div>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">No images yet</p>
                    <p className="mt-2 max-w-xs mx-auto text-xs sm:text-sm">
                      Enter a prompt above and click &quot;Generate image&quot; to see your creations appear here.
                    </p>
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
