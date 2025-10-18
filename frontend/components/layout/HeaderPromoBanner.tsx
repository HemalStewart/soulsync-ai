'use client';

import { useMemo } from 'react';
import { X } from 'lucide-react';

type Countdown = {
  hours: number;
  minutes: number;
  seconds: number;
};

interface HeaderPromoBannerProps {
  timeLeft: Countdown;
  onClose: () => void;
}

const HeaderPromoBanner = ({ timeLeft, onClose }: HeaderPromoBannerProps) => {
  const countdown = useMemo(() => {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${pad(timeLeft.hours)}:${pad(timeLeft.minutes)}:${pad(
      timeLeft.seconds,
    )}`;
  }, [timeLeft.hours, timeLeft.minutes, timeLeft.seconds]);

  const [hours, minutes, seconds] = useMemo(() => countdown.split(':'), [countdown]);

  return (
    <div className="border-b border-gray-200/60 bg-gradient-to-r from-orange-100 via-red-50 to-orange-100">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 py-2.5 sm:py-3">
        {/* Mobile Layout */}
        <div className="flex md:hidden items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex flex-col gap-0.5 flex-shrink-0">
              <span className="text-[9px] font-bold text-orange-800 tracking-wide leading-tight">
                LIMITED TIME
              </span>
              <span className="text-xs font-black bg-gradient-to-r from-orange-700 to-red-600 bg-clip-text text-transparent leading-tight">
                MEGA SALE
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 text-white text-[10px] font-black shadow-lg shadow-orange-500/50 animate-pulse whitespace-nowrap">
              75% OFF
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="flex gap-0.5 font-mono text-[11px] font-bold">
              <span className="px-1.5 py-0.5 rounded bg-white/80 text-gray-900 shadow-sm">
                {hours}
              </span>
              <span className="text-gray-500">:</span>
              <span className="px-1.5 py-0.5 rounded bg-white/80 text-gray-900 shadow-sm">
                {minutes}
              </span>
              <span className="text-gray-500">:</span>
              <span className="px-1.5 py-0.5 rounded bg-white/80 text-gray-900 shadow-sm">
                {seconds}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/50 rounded-lg transition-all duration-200 flex-shrink-0"
              aria-label="Dismiss banner"
            >
              <X size={16} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-orange-800 tracking-wide">
                LIMITED TIME
              </span>
              <span className="text-sm font-black bg-gradient-to-r from-orange-700 to-red-600 bg-clip-text text-transparent">
                MEGA SALE
              </span>
            </div>
            <div className="h-12 w-px bg-gradient-to-b from-orange-400 to-transparent opacity-40" />
            <span className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 text-white text-sm font-black shadow-lg shadow-orange-500/50 hover:shadow-orange-600/70 hover:scale-105 transition-all duration-200 animate-pulse">
              UP TO 75% OFF
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1 font-mono text-xs font-bold">
              <span className="px-3 py-1.5 rounded-lg bg-white/80 font-bold text-gray-900 shadow-sm">
                {hours}
              </span>
              <span className="text-gray-500 px-1">:</span>
              <span className="px-3 py-1.5 rounded-lg bg-white/80 font-bold text-gray-900 shadow-sm">
                {minutes}
              </span>
              <span className="text-gray-500 px-1">:</span>
              <span className="px-3 py-1.5 rounded-lg bg-white/80 font-bold text-gray-900 shadow-sm">
                {seconds}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-all duration-200 hover:scale-110"
              aria-label="Dismiss banner"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeaderPromoBanner;
