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
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
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
          className="inline-flex items-center space-x-2 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:shadow-lg"
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
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="text-sm font-semibold leading-tight">
          🎉 30 Days of Free Text Chats!{' '}
          <a href="#" className="text-blue-600 hover:underline">
            Join Now
          </a>
        </div>
        <p className="text-xs text-gray-600">
          Membership during event = unlimited messaging.
        </p>
      </div>
    ),
  },
];

const AUTOPLAY_DELAY = 4000;

const PromoCarousel = () => {
  const [index, setIndex] = useState(0);

  const slideCount = useMemo(() => slides.length, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % slideCount);
    }, AUTOPLAY_DELAY);

    return () => clearInterval(interval);
  }, [slideCount]);

  const activeSlide = slides[index];

  const goToPrev = () => {
    setIndex((prev) => (prev - 1 + slideCount) % slideCount);
  };

  const goToNext = () => {
    setIndex((prev) => (prev + 1) % slideCount);
  };

  return (
    <div className="mx-auto mb-8 max-w-7xl px-4">
      <div
        className={`group relative overflow-hidden rounded-2xl px-6 py-4 transition-all duration-500 ${activeSlide.background} shadow-lg flex items-center`}
      >
        <div className="min-h-[60px] flex items-center w-full">{activeSlide.content}</div>

        {/* Navigation Dots */}
        {/* <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2">
          {slides.map((slide, dotIndex) => (
            <button
              key={slide.id}
              aria-label={`Go to slide ${dotIndex + 1}`}
              onClick={() => setIndex(dotIndex)}
              className={`transition-all duration-300 ${
                index === dotIndex
                  ? 'h-2 w-6 bg-gray-600'
                  : 'h-2 w-2 bg-gray-300 hover:bg-gray-400'
              }`}
              style={{ borderRadius: '9999px' }}
            />
          ))}
        </div> */}

        {/* Arrow Navigation */}
        <button
          onClick={goToPrev}
          className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/40 text-gray-700 transition hover:bg-white/60 group-hover:opacity-100 md:opacity-0"
          aria-label="Previous slide"
        >
          <ChevronLeft size={18} />
        </button>

        <button
          onClick={goToNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/40 text-gray-700 transition hover:bg-white/60 group-hover:opacity-100 md:opacity-0"
          aria-label="Next slide"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default PromoCarousel;