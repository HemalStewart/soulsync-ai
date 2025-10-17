'use client';

import {
  ChangeEvent,
  useMemo,
  useState,
} from 'react';
import Image from 'next/image';
import {
  Clock3,
  Film,
  ImagePlus,
  Lock,
  LogIn,
  Play,
  RefreshCw,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/components/auth/AuthContext';

type BuilderTab = 'image-to-video' | 'video-extend' | 'text-to-video';

const builderTabs: Array<{ id: BuilderTab; label: string; description: string }> = [
  { id: 'image-to-video', label: 'Image to Video', description: 'Transform a single key frame into motion.' },
  { id: 'video-extend', label: 'Video Extend', description: 'Grow an existing clip with seamless context.' },
  { id: 'text-to-video', label: 'Text to Video', description: 'Generate cinematic moments from a prompt.' },
];

const galleryItems = [
  {
    id: 'vid-1',
    title: 'Aurora Drifter',
    duration: '14s loop',
    createdAt: '2 hours ago',
    thumbnail:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=640&h=360&fit=crop',
  },
  {
    id: 'vid-2',
    title: 'Rainy Alley',
    duration: '9s clip',
    createdAt: 'Yesterday',
    thumbnail:
      'https://images.unsplash.com/photo-1432888622747-4eb9a8c83f23?w=640&h=360&fit=crop',
  },
  {
    id: 'vid-3',
    title: 'Midnight Skyline',
    duration: '12s loop',
    createdAt: 'Sep 14',
    thumbnail:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=640&h=360&fit=crop',
  },
];

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
  const [activeTab, setActiveTab] = useState<BuilderTab>('image-to-video');
  const [prompt, setPrompt] = useState('');
  const [extendPrompt, setExtendPrompt] = useState('');
  const [textPrompt, setTextPrompt] = useState('');
  const [showGallery, setShowGallery] = useState(true);

  const promptCount = useMemo(() => prompt.length, [prompt]);
  const extendCount = useMemo(() => extendPrompt.length, [extendPrompt]);
  const textCount = useMemo(() => textPrompt.length, [textPrompt]);

  const handlePromptChange =
    (setter: (value: string) => void) =>
    (event: ChangeEvent<HTMLTextAreaElement>) =>
      setter(event.target.value.slice(0, 800));

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
              <div className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white shadow">
                50 coins per render
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
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-6 animate-fade-up" style={{ animationDelay: '0.22s' }}>
                {activeTab === 'image-to-video' && (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">Key frame</span>
                        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                          Optional
                        </span>
                      </div>
                      <label className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 p-8 text-center transition hover:border-blue-500 hover:bg-blue-50">
                        <input type="file" accept="image/*" className="hidden" />
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg">
                          <UploadCloud className="h-8 w-8" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-gray-900">Click to upload reference</p>
                          <p className="text-xs text-gray-500">
                            PNG or JPG up to 8MB •{' '}
                            <span className="cursor-pointer font-semibold text-blue-600 underline-offset-4 hover:underline">
                              open gallery
                            </span>
                          </p>
                        </div>
                      </label>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-900">
                        Prompt
                      </label>
                      <div className="relative">
                        <textarea
                          value={prompt}
                          onChange={handlePromptChange(setPrompt)}
                          placeholder="Describe motion, mood, and camera movement..."
                          className="h-36 w-full rounded-2xl border border-gray-200 bg-blue-50/40 p-4 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                          maxLength={800}
                        />
                        <span className="absolute bottom-3 right-4 text-xs text-gray-500">
                          {promptCount}/800
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'video-extend' && (
                  <>
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-900">
                        Upload existing clip
                      </label>
                      <label className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 p-8 text-center transition hover:border-blue-500 hover:bg-blue-50">
                        <input type="file" accept="video/*" className="hidden" />
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg">
                          <Play className="h-8 w-8" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-gray-900">Drop a video or browse files</p>
                          <p className="text-xs text-gray-500">MP4, MOV, or WebM up to 30 seconds</p>
                        </div>
                      </label>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-900">
                        Extension prompt
                      </label>
                      <div className="relative">
                        <textarea
                          value={extendPrompt}
                          onChange={handlePromptChange(setExtendPrompt)}
                          placeholder="Explain how the scene continues..."
                          className="h-36 w-full rounded-2xl border border-gray-200 bg-blue-50/40 p-4 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                          maxLength={800}
                        />
                        <span className="absolute bottom-3 right-4 text-xs text-gray-500">
                          {extendCount}/800
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'text-to-video' && (
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
                          onChange={handlePromptChange(setTextPrompt)}
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
                <div className="mt-4 flex-1 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600/80 p-4 shadow-inner">
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-sm text-blue-50">
                    <Sparkles className="h-8 w-8 animate-pulse text-white drop-shadow" />
                    <p>Render preview appears here once generation starts.</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-blue-50">
                  <span className="rounded-full bg-white/20 px-3 py-1">Motion boost</span>
                  <span className="rounded-full bg-white/20 px-3 py-1">Camera pan</span>
                  <span className="rounded-full bg-white/20 px-3 py-1">Loop safe</span>
                </div>
                <button className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-blue-700 hover:to-indigo-700">
                  <Sparkles className="h-4 w-4" />
                  Generate video
                  <span className="rounded-full bg-white/20 px-2 py-1 text-xs">50 coins</span>
                </button>
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
              <div className="flex gap-3">
                <button
                  onClick={() => setShowGallery((prev) => !prev)}
                  className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  {showGallery ? 'Hide gallery' : 'Show gallery'}
                </button>
                <button className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              </div>
            </div>

            {showGallery ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {galleryItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg animate-fade-up"
                    style={{ animationDelay: `${0.24 + index * 0.05}s` }}
                  >
                    <div className="relative h-44 w-full overflow-hidden">
                      <Image
                        src={item.thumbnail}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                      <span className="absolute top-3 left-3 rounded-full bg-blue-600/80 px-3 py-1 text-xs font-medium text-white">
                        {item.duration}
                      </span>
                    </div>
                    <div className="space-y-3 p-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                        <p className="text-xs text-gray-500">{item.createdAt}</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50">
                          Download
                        </button>
                        <button className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700">
                          Share
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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

          <section className="space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-lg animate-fade-up" style={{ animationDelay: '0.24s' }}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Render activity</h2>
                <p className="text-sm text-gray-600">
                  Track your recent exports and plan more story beats.
                </p>
              </div>
              <button className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100">
                View full history
              </button>
            </div>
            <div className="space-y-4">
              {[
                {
                  id: 'act-1',
                  title: 'Night market extension queued',
                  description: 'Extending clip by 6s with crowd animation.',
                  timestamp: '4 minutes ago',
                },
                {
                  id: 'act-2',
                  title: 'Synthwave skyline saved',
                  description: 'Image-to-video render stored in gallery.',
                  timestamp: '1 hour ago',
                },
                {
                  id: 'act-3',
                  title: 'Pro color preset unlocked',
                  description: 'A new LUT is now available in your toolbox.',
                  timestamp: 'Yesterday',
                },
              ].map((entry, index) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm animate-fade-up"
                  style={{ animationDelay: `${0.3 + index * 0.05}s` }}
                >
                  <div className="rounded-full bg-blue-600 p-2 text-white">
                    <Clock3 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{entry.title}</p>
                    <p className="text-sm text-gray-600">{entry.description}</p>
                    <p className="text-xs text-gray-400">{entry.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
};

export default VideoContent;
