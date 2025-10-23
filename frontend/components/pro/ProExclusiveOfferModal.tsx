'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Sparkles } from 'lucide-react';

interface ProExclusiveOfferModalProps {
  open: boolean;
  onClose: () => void;
  onActivate?: (planId: string) => void;
  initialPlanId?: 'monthly' | 'annual';
}

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

const ProExclusiveOfferModal = ({ open, onClose, onActivate, initialPlanId }: ProExclusiveOfferModalProps) => {
  const [isMounted, setIsMounted] = useState(open);
  const [isVisible, setIsVisible] = useState(open);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [timeLeft, setTimeLeft] = useState(5 * 60);

  useEffect(() => {
    let timeoutId: number | undefined;
    let rafId: number | undefined;

    if (open) {
      setIsMounted(true);
      rafId = window.requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
      timeoutId = window.setTimeout(() => setIsMounted(false), 300);
    }

    return () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
      if (rafId !== undefined) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedPlan(initialPlanId ?? 'annual');
    setTimeLeft(5 * 60);

    const interval = window.setInterval(() => {
      setTimeLeft((previous) => (previous > 0 ? previous - 1 : 0));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [open, initialPlanId]);

  const plans = useMemo(
    () => [
      {
        id: 'monthly',
        label: '1 month',
        price: '$9.99/mo',
        original: '$19.99',
        description: 'Monthly billing.',
      },
      {
        id: 'annual',
        label: '12 months',
        price: '$4.99/mo',
        original: '$9.99',
        description: 'Best savings for a year.',
      },
    ],
    []
  );

  if (!isMounted) {
    return null;
  }

  const handleActivate = () => {
    onActivate?.(selectedPlan);
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-[130] flex items-center justify-center px-2 py-3 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div
        className={`absolute inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      <div className={`relative w-full max-w-sm overflow-hidden rounded-2xl border border-purple-200/40 bg-white shadow-2xl ${isVisible ? 'animate-scale-up' : 'animate-scale-down'} max-h-[95vh] overflow-y-auto`}>
        <div className="absolute right-2 top-2">
          <button
            onClick={onClose}
            className="rounded-full bg-white/80 p-1.5 text-gray-500 shadow-md transition hover:bg-purple-50 hover:text-gray-900"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 px-4 py-5 text-white">
          <div className="flex flex-col gap-2.5 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 shadow-lg">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">Exclusive Offer!</h2>
              <p className="mt-1.5 text-xs text-white/80 leading-snug">
                Save big on your favorite companions with limited-time pricing.
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 space-y-3.5">
          <div className="flex justify-center">
            <div className="inline-flex items-center rounded-full bg-gray-900 text-white px-3 py-1.5 text-xs font-semibold shadow-inner gap-2">
              <span className="text-blue-200/90">50% off</span>
              <span className="text-white/30">›</span>
              <span className="bg-gradient-to-r from-teal-300 via-blue-200 to-purple-300 bg-clip-text text-transparent font-bold">
                75% off
              </span>
            </div>
          </div>

          <div className="grid gap-2.5 grid-cols-2">
            {plans.map((plan) => {
              const active = selectedPlan === plan.id;
              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id as 'monthly' | 'annual')}
                  className={`relative rounded-lg border px-3 py-2.5 text-left shadow-sm transition-all duration-200 ${
                    active
                      ? 'border-purple-500 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-purple-200 hover:shadow-sm'
                  }`}
                >
                  <p className="text-xs font-semibold text-gray-900">{plan.label}</p>
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <span className="text-base font-bold text-purple-600">{plan.price}</span>
                    <span className="text-[8px] text-gray-400 line-through">{plan.original}</span>
                  </div>
                  <p className="mt-1 text-[8px] text-gray-500 leading-tight">{plan.description}</p>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={handleActivate}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg transition hover:from-cyan-500 hover:via-blue-500 hover:to-purple-500 sm:w-auto"
            >
              Activate 75% Off!
            </button>
            <div className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-2.5 py-2 text-xs font-bold text-white whitespace-nowrap">
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProExclusiveOfferModal;
