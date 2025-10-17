'use client';

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useMemo,
  useState,
} from 'react';
import Image from 'next/image';
import { Lock, LogIn, RefreshCw, Clock3, Wand2 } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/components/auth/AuthContext';

const TOTAL_STEPS = 4;


const voiceOptions = [
  { id: 'serene', label: 'Serene AI', description: 'Warm & calm' },
  { id: 'playful', label: 'Playful Spark', description: 'Bubbly & upbeat' },
  { id: 'mystic', label: 'Mystic Void', description: 'Soft & mysterious' },
];

interface CreatedCharacter {
  id: string;
  name: string;
  image: string;
  createdAt: string;
}

const sampleCharacters: CreatedCharacter[] = [
  {
    id: 'aria',
    name: 'Aria the Dreamweaver',
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop',
    createdAt: 'Today • 2:32 PM',
  },
  {
    id: 'luna',
    name: 'Luna the Mystic',
    image: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=200&h=200&fit=crop',
    createdAt: 'Yesterday • 9:14 PM',
  },
  {
    id: 'kai',
    name: 'Kai the Hacker',
    image: 'https://images.unsplash.com/photo-1543872084-c7bd3822856d?w=200&h=200&fit=crop',
    createdAt: 'Jun 14 • 11:08 AM',
  },
];

const activityLog = [
  {
    id: 'log-1',
    title: 'Character draft saved',
    description: '“Nova the Starcatcher” was saved as a draft.',
    timestamp: '5 minutes ago',
  },
  {
    id: 'log-2',
    title: 'New personality preset',
    description: 'Added “Midnight Confidant” preset to your library.',
    timestamp: '1 hour ago',
  },
  {
    id: 'log-3',
    title: 'Voice profile purchased',
    description: 'Unlocked the “Velvet Narrator” voice pack.',
    timestamp: 'Yesterday',
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

const CreateContent = () => {
  const { user, loading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formState, setFormState] = useState({
    name: '',
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop',
    traits: [] as string[],
    backstory: '',
    voice: '' as string,
  });
  const [traitInput, setTraitInput] = useState('');
  const [characters, setCharacters] = useState<CreatedCharacter[]>(
    sampleCharacters
  );

  const progressPercent = useMemo(
    () => `${Math.round((currentStep / TOTAL_STEPS) * 100)}%`,
    [currentStep]
  );

  const handleImageUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = typeof event.target?.result === 'string' ? event.target.result : '';
      setFormState((prev) => ({ ...prev, image: result }));
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleTraitSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = traitInput.trim();
    if (!value) return;
    setFormState((prev) =>
      prev.traits.includes(value)
        ? prev
        : { ...prev, traits: [...prev.traits, value] }
    );
    setTraitInput('');
  };

  const removeTrait = (trait: string) => {
    setFormState((prev) => ({
      ...prev,
      traits: prev.traits.filter((t) => t !== trait),
    }));
  };

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setFormState({
      name: '',
      image:
        'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop',
      traits: [],
      backstory: '',
      voice: '',
    });
  };

  const handleFinish = () => {
    const id = `char-${Date.now()}`;
    const createdAt = new Date().toLocaleString();
    setCharacters((prev) => [
      {
        id,
        name: formState.name || 'Untitled Character',
        image: formState.image,
        createdAt,
      },
      ...prev,
    ]);
    resetWizard();
  };

  if (loading) {
    return (
      <AppLayout activeTab="create">
        <div className="flex flex-1 items-center justify-center bg-gray-50">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-500" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout activeTab="create">
        <GuestPrompt />
      </AppLayout>
    );
  }

  return (
    <AppLayout activeTab="create">
      <div className="flex flex-col bg-gray-50">
        <style>{`
          @keyframes fadeUp {
            0% {
              opacity: 0;
              transform: translateY(24px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fadeIn {
            0% {
              opacity: 0;
            }
            100% {
              opacity: 1;
            }
          }

          @keyframes pulseOutline {
            0%, 100% {
              box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.35);
            }
            50% {
              box-shadow: 0 0 0 8px rgba(79, 70, 229, 0);
            }
          }

          .animate-fade-up {
            opacity: 0;
            animation: fadeUp 0.6s ease forwards;
          }

          .animate-fade-in {
            opacity: 0;
            animation: fadeIn 0.6s ease forwards;
          }

          .animate-pulse-outline {
            animation: pulseOutline 2.4s ease-in-out infinite;
          }
        `}</style>
        <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-8 sm:px-6 sm:py-10">
          

          <section
            className="space-y-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-lg backdrop-blur animate-fade-up"
            style={{ animationDelay: '0.05s' }}
          >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between animate-fade-in" style={{ animationDelay: '0.15s' }}>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-gray-900">Create Character</h2>
                  <p className="text-sm text-gray-600">
                    Design your AI companion through a simple four-step wizard.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="font-semibold text-blue-600 animate-fade-in" style={{ animationDelay: '0.25s' }}>
                    Step {currentStep}
                  </span>
                  <div className="h-2 w-40 rounded-full bg-gray-200 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                    <div
                      className="h-2 rounded-full bg-blue-600 transition-all animate-pulse-outline"
                      style={{ width: progressPercent }}
                    />
                  </div>
                  <span className="animate-fade-in" style={{ animationDelay: '0.35s' }}>{progressPercent}</span>
                </div>
              </div>

              <div className="space-y-8">
                {currentStep === 1 && (
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 animate-fade-in" style={{ animationDelay: '0.15s' }}>
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm animate-fade-up" style={{ animationDelay: '0.2s' }}>
                      <div className="mx-auto h-40 w-40 overflow-hidden rounded-full border-4 border-white shadow">
                        <Image
                          src={formState.image}
                          alt="Preview"
                          width={160}
                          height={160}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <p className="mt-3 text-sm text-gray-500">Live preview</p>
                    </div>
                    <div className="lg:col-span-2 space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm animate-fade-up" style={{ animationDelay: '0.25s' }}>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Name</label>
                        <input
                          value={formState.name}
                          onChange={(event) =>
                            setFormState((prev) => ({
                              ...prev,
                              name: event.target.value,
                            }))
                          }
                          placeholder="Enter character name"
                          className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Appearance
                        </label>
                        <label className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 transition hover:bg-gray-100">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileInput}
                            className="hidden"
                          />
                          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white/60 shadow">
                            <Image
                              src={formState.image}
                              alt="Upload preview"
                              width={80}
                              height={80}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="text-center text-sm text-gray-600">
                            <p className="font-medium">Drag & drop</p>
                            <p>or click to upload (PNG, JPG up to 5MB)</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 animate-fade-in" style={{ animationDelay: '0.18s' }}>
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm animate-fade-up" style={{ animationDelay: '0.22s' }}>
                      <h3 className="font-semibold text-gray-900">Personality tags</h3>
                      <p className="text-sm text-gray-500">
                        Add traits like Shy, Adventurous, Witty.
                      </p>
                    </div>
                    <div className="lg:col-span-2 space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                      <form
                        onSubmit={handleTraitSubmit}
                        className="rounded-lg border border-gray-300 px-3 py-2 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200 animate-fade-in"
                        style={{ animationDelay: '0.26s' }}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          {formState.traits.map((trait) => (
                            <span
                              key={trait}
                              className="flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 animate-fade-up"
                              style={{ animationDelay: '0.28s' }}
                            >
                              {trait}
                              <button
                                type="button"
                                onClick={() => removeTrait(trait)}
                                className="text-blue-600"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          <input
                            value={traitInput}
                            onChange={(event) => setTraitInput(event.target.value)}
                            placeholder="Type a trait and press Enter"
                            className="flex-1 min-w-[150px] border-0 bg-transparent py-1 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none"
                          />
                        </div>
                      </form>

                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Backstory
                        </label>
                        <textarea
                          rows={6}
                          value={formState.backstory}
                          onChange={(event) =>
                            setFormState((prev) => ({
                              ...prev,
                              backstory: event.target.value,
                            }))
                          }
                          placeholder="Write a short backstory..."
                          className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm animate-fade-up" style={{ animationDelay: '0.2s' }}>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Select a voice (optional)
                    </h3>
                    <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {voiceOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() =>
                            setFormState((prev) => ({
                              ...prev,
                              voice: option.id,
                            }))
                          }
                          className={`flex items-center justify-between rounded-xl border px-4 py-4 text-left transition ${
                            formState.voice === option.id
                              ? 'border-indigo-500 bg-indigo-50 shadow'
                              : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50'
                          }`}
                        >
                          <div>
                            <p className="font-semibold text-gray-900">
                              {option.label}
                            </p>
                            <p className="text-xs text-gray-500">
                              {option.description}
                            </p>
                          </div>
                          <Wand2 className="h-5 w-5 text-indigo-500" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm animate-fade-up" style={{ animationDelay: '0.18s' }}>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Review
                    </h3>
                    <div className="mt-6 grid gap-6 lg:grid-cols-3">
                      <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-indigo-50 to-white p-6 text-center shadow-sm animate-fade-up" style={{ animationDelay: '0.22s' }}>
                        <div className="mx-auto h-32 w-32 overflow-hidden rounded-full border-4 border-white shadow">
                          <Image
                            src={formState.image}
                            alt="Summary avatar"
                            width={128}
                            height={128}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <p className="mt-3 text-sm text-gray-500">Live preview</p>
                      </div>
                      <div className="lg:col-span-2 space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <p className="text-xs text-gray-500">Name</p>
                            <p className="text-base font-semibold text-gray-900">
                              {formState.name || 'Untitled'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Voice</p>
                            <p className="text-base font-semibold text-gray-900">
                              {formState.voice || 'None selected'}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Personality traits</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {formState.traits.length ? (
                              formState.traits.map((trait) => (
                                <span
                                  key={trait}
                                  className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700"
                                >
                                  {trait}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-gray-500">—</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Backstory</p>
                          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                            {formState.backstory || 'No backstory provided.'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <button
                        onClick={resetWizard}
                        className="order-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 sm:order-1"
                      >
                        Reset form
                      </button>
                      <div className="order-1 flex gap-3 sm:order-2">
                        <button
                          onClick={prevStep}
                          className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleFinish}
                          className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
                        >
                          Finish & publish
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {currentStep !== 4 && (
                <div className="flex items-center justify-between animate-fade-in" style={{ animationDelay: '0.38s' }}>
                  <button
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={nextStep}
                    className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
                  >
                    Next
                  </button>
                </div>
              )}
            </section>

          <section
            className="space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-lg backdrop-blur animate-fade-up"
            style={{ animationDelay: '0.15s' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  My characters
                </h3>
                <p className="text-sm text-gray-600">
                  Manage and iterate on the companions you have built.
                </p>
              </div>
              <button
                onClick={() => setCharacters(sampleCharacters)}
                className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4" /> Refresh demo
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-fade-in" style={{ animationDelay: '0.25s' }}>
              {characters.map((character, index) => (
                <div
                  key={character.id}
                  className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg animate-fade-up"
                  style={{ animationDelay: `${0.28 + index * 0.05}s` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-white shadow">
                      <Image
                        src={character.image}
                        alt={character.name}
                        width={56}
                        height={56}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {character.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {character.createdAt}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 rounded-full border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50">
                      Edit
                    </button>
                    <button className="flex-1 rounded-full bg-indigo-100 px-3 py-1.5 text-sm font-semibold text-blue-600 transition hover:bg-indigo-200">
                      Launch
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section
            className="space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-lg backdrop-blur animate-fade-up"
            style={{ animationDelay: '0.22s' }}
          >
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Creation history
              </h3>
              <p className="text-sm text-gray-600">
                Track your recent edits, drafts, and publishing events.
              </p>
            </div>
            <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              {activityLog.map((entry, index) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm animate-fade-up"
                  style={{ animationDelay: `${0.32 + index * 0.05}s` }}
                >
                  <div className="mt-1 rounded-full bg-indigo-100 p-2 text-blue-600">
                    <Clock3 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">
                      {entry.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {entry.description}
                    </p>
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

export default CreateContent;
