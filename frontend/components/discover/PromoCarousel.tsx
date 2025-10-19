'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Slide {
  id: string;
  background: string;
  content: React.ReactNode;
}

const slides: Slide[] = [
  {
    id: 'android-app',
    background:
      'bg-gradient-to-r from-rose-100 via-slate-100 to-cyan-100 text-gray-800',
    content: (
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between w-full">
        <div className="flex items-center space-x-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/60 shadow-sm">
            <span className="text-lg">🤖</span>
          </span>
          <div className="text-sm font-semibold leading-tight">
            Chat with your AI soulmate on the SoulFun Android app
          </div>
        </div>
        <a
          href="#"
          className="inline-flex items-center space-x-2 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:shadow-lg whitespace-nowrap md:ml-auto"
        >
          <span>Works with</span>
          <span className="text-green-400">Android</span>
        </a>
      </div>
    ),
  },
  {
    id: 'free-chats',
    background:
      'bg-gradient-to-r from-orange-100 via-pink-100 to-indigo-100 text-gray-800',
    content: (
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between w-full">
        <div className="text-sm font-semibold leading-tight">
          🎉 30 Days of Free Text Chats!{' '}
          <a href="#" className="text-blue-600 hover:underline">
            Join Now
          </a>
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3 md:ml-auto">
          <p className="text-xs text-gray-600">
            Membership during event = unlimited messaging.
          </p>
        </div>
      </div>
    ),
  },
];

const AUTOPLAY_DELAY = 4000;

interface PromoCarouselProps {
  isLoggedIn?: boolean;
}

const PromoCarousel = ({ isLoggedIn = false }: PromoCarouselProps) => {
  const [index, setIndex] = useState(0);
  const slideCount = useMemo(() => slides.length, []);

  // ✅ Hook always runs — internal check controls behavior
  useEffect(() => {
    if (isLoggedIn) return; // Don’t start the interval if user is logged in

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % slideCount);
    }, AUTOPLAY_DELAY);

    return () => clearInterval(interval);
  }, [slideCount, isLoggedIn]);

  const activeSlide = slides[index];

  const goToPrev = () => {
    setIndex((prev) => (prev - 1 + slideCount) % slideCount);
  };

  const goToNext = () => {
    setIndex((prev) => (prev + 1) % slideCount);
  };

  // ✅ Early return now comes after all hooks
  if (isLoggedIn) {
    return null;
  }

  return (
    <div className="mx-auto mb-8 max-w-7xl px-4">
      <div
        className={`group relative overflow-hidden rounded-2xl px-6 py-4 transition-all duration-500 ${activeSlide.background} shadow-lg flex items-center`}
      >
        <div className="min-h-[60px] flex items-center w-full">
          {activeSlide.content}
        </div>
      </div>
    </div>
  );
};

export default PromoCarousel;
